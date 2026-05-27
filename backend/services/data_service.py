import os
import numpy as np
import pandas as pd


H5AD_METADATA_FIELDS = ("cell_type", "disease", "AgeGroup", "donor_id")


def _decode_h5_value(value):
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return str(value)


def _empty_cell_metadata(count):
    return [{} for _ in range(count)]


def _read_categorical_group(group):
    categories = [_decode_h5_value(item) for item in group["categories"][:]]
    codes = group["codes"][:]

    values = []
    for code in codes:
        index = int(code)
        if 0 <= index < len(categories):
            values.append(categories[index])
        else:
            values.append(None)
    return values


def _read_obs_values(obs_group, field_name):
    if field_name not in obs_group:
        return None

    obj = obs_group[field_name]
    if hasattr(obj, "dtype"):
        return [_decode_h5_value(value) for value in obj[:]]
    if "categories" in obj and "codes" in obj:
        return _read_categorical_group(obj)
    return None


def _read_matrix(matrix_obj):
    if hasattr(matrix_obj, "shape") and len(matrix_obj.shape) == 2:
        return matrix_obj[:].astype(np.float32)

    if all(key in matrix_obj for key in ("data", "indices", "indptr")):
        shape_attr = matrix_obj.attrs.get("shape")
        shape = tuple(shape_attr.tolist() if hasattr(shape_attr, "tolist") else shape_attr)
        encoding = matrix_obj.attrs.get("encoding-type", b"")
        if isinstance(encoding, bytes):
            encoding = encoding.decode("utf-8")

        data = matrix_obj["data"][:]
        indices = matrix_obj["indices"][:]
        indptr = matrix_obj["indptr"][:]

        from scipy.sparse import csc_matrix, csr_matrix

        if encoding == "csc_matrix":
            matrix = csc_matrix((data, indices, indptr), shape=shape)
        else:
            matrix = csr_matrix((data, indices, indptr), shape=shape)
        return matrix.toarray().astype(np.float32)

    raise ValueError("Unsupported matrix encoding in HDF5 file")


def _load_h5ad(path):
    import h5py

    with h5py.File(path, "r") as f:
        obs_group = f["obs"]
        obsm_group = f["obsm"]
        var_group = f["var"]

        umap_coords = None
        if "X_umap" in obsm_group:
            umap_raw = obsm_group["X_umap"]
            if hasattr(umap_raw, "shape") and len(umap_raw.shape) == 2:
                umap_coords = umap_raw[:].astype(np.float32)
            else:
                umap_coords = _read_matrix(umap_raw)

        if "X_pca" in obsm_group:
            array = obsm_group["X_pca"][:].astype(np.float32)
            feature_names = [f"PC{i + 1}" for i in range(array.shape[1])]
        else:
            array = _read_matrix(f["X"])
            feature_names = _read_obs_values(var_group, "feature_name")
            if not feature_names:
                feature_names = _read_obs_values(var_group, "_index")
            if not feature_names:
                feature_names = [str(i) for i in range(array.shape[1])]

        cell_names = _read_obs_values(obs_group, "_index")
        if not cell_names:
            cell_names = [str(i) for i in range(array.shape[0])]

        metadata_columns = {
            field: _read_obs_values(obs_group, field)
            for field in H5AD_METADATA_FIELDS
            if field in obs_group
        }

        cell_metadata = []
        for row_index in range(array.shape[0]):
            entry = {}
            for field, values in metadata_columns.items():
                if values and row_index < len(values) and values[row_index] is not None:
                    entry[field] = values[row_index]
            if umap_coords is not None and row_index < umap_coords.shape[0] and umap_coords.shape[1] >= 2:
                entry["umap_1"] = float(umap_coords[row_index, 0])
                entry["umap_2"] = float(umap_coords[row_index, 1])
            cell_metadata.append(entry)

    return array, cell_names, feature_names, cell_metadata


def load_csv(path):
    """Load CSV/TSV file. Returns (array, cell_names, feature_names, cell_metadata)."""
    sep = "\t" if path.endswith(".tsv") else ","
    df = pd.read_csv(path, sep=sep, index_col=0)
    cell_names = list(df.index.astype(str))
    feature_names = list(df.columns.astype(str))
    array = df.values.astype(np.float32)
    return array, cell_names, feature_names, _empty_cell_metadata(array.shape[0])


def load_h5(path):
    """Load HDF5/AnnData file. Returns (array, cell_names, feature_names, cell_metadata)."""
    import h5py

    with h5py.File(path, "r") as f:
        if all(key in f for key in ("obs", "obsm", "var", "X")):
            return _load_h5ad(path)

        # Try 10x HDF5 format
        if "matrix" in f:
            grp = f["matrix"]
            data = grp["data"][:]
            indices = grp["indices"][:]
            indptr = grp["indptr"][:]
            shape = tuple(grp["shape"][:])
            from scipy.sparse import csc_matrix
            mat = csc_matrix((data, indices, indptr), shape=shape)
            array = mat.T.toarray().astype(np.float32)
            barcodes = grp["barcodes"][:] if "barcodes" in grp else [str(i) for i in range(shape[1])]
            cell_names = [b.decode() if isinstance(b, bytes) else str(b) for b in barcodes]
            features_grp = grp["features"] if "features" in grp else None
            if features_grp is not None and "name" in features_grp:
                feature_names = [
                    n.decode() if isinstance(n, bytes) else str(n)
                    for n in features_grp["name"][:]
                ]
            else:
                feature_names = [str(i) for i in range(shape[0])]
        else:
            # Generic HDF5: first 2D dataset found
            array = None
            cell_names = []
            feature_names = []
            for key in f.keys():
                ds = f[key]
                if hasattr(ds, "shape") and len(ds.shape) == 2:
                    array = ds[:].astype(np.float32)
                    cell_names = [str(i) for i in range(array.shape[0])]
                    feature_names = [str(i) for i in range(array.shape[1])]
                    break
            if array is None:
                raise ValueError("No 2D dataset found in HDF5 file")

    return array, cell_names, feature_names, _empty_cell_metadata(array.shape[0])


def load_h5ad_umap(path):
    """Load precomputed UMAP coords from h5ad obsm/X_umap if available.
    Returns np.ndarray (n_cells, 2) or None.
    """
    import h5py

    with h5py.File(path, "r") as f:
        if not all(key in f for key in ("obs", "obsm")):
            return None
        obsm_group = f["obsm"]
        if "X_umap" not in obsm_group:
            return None

        obj = obsm_group["X_umap"]
        if hasattr(obj, "shape") and len(obj.shape) == 2:
            coords = obj[:].astype(np.float32)
        else:
            coords = _read_matrix(obj)

        if coords.ndim != 2 or coords.shape[0] == 0:
            return None
        if coords.shape[1] == 1:
            coords = np.column_stack([coords[:, 0], np.zeros(coords.shape[0], dtype=np.float32)]).astype(np.float32)
        elif coords.shape[1] > 2:
            coords = coords[:, :2].astype(np.float32)
        else:
            coords = coords.astype(np.float32)

        return coords


def validate_data(array):
    """Validate numpy array for ANN indexing."""
    if array is None:
        return {"valid": False, "message": "No data loaded", "shape": None}
    if array.ndim != 2:
        return {"valid": False, "message": "Data must be 2D (cells x features)", "shape": array.shape}
    if array.shape[0] == 0 or array.shape[1] == 0:
        return {"valid": False, "message": "Data has zero cells or features", "shape": array.shape}
    if np.any(np.isnan(array)) or np.any(np.isinf(array)):
        return {"valid": False, "message": "Data contains NaN or Inf values", "shape": array.shape}
    return {"valid": True, "message": "OK", "shape": tuple(array.shape)}


def generate_random_data(n_cells=1000, n_features=50):
    """Generate synthetic single-cell data for demo purposes."""
    rng = np.random.default_rng(42)
    # Simulate sparse count-like data typical of scRNA-seq
    array = rng.negative_binomial(1, 0.5, size=(n_cells, n_features)).astype(np.float32)
    cell_names = [f"cell_{i}" for i in range(n_cells)]
    feature_names = [f"gene_{i}" for i in range(n_features)]
    return array, cell_names, feature_names, _empty_cell_metadata(n_cells)


def normalize_l2(array):
    """L2-normalize each row."""
    norms = np.linalg.norm(array, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return array / norms


def standardize(array):
    """Zero-mean, unit-variance standardization per feature."""
    mean = array.mean(axis=0)
    std = array.std(axis=0)
    std = np.where(std == 0, 1, std)
    return (array - mean) / std
