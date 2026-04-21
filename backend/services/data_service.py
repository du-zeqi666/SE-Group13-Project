import os
import numpy as np
import pandas as pd


def load_csv(path):
    """Load CSV/TSV file. Returns (array, cell_names, feature_names)."""
    sep = "\t" if path.endswith(".tsv") else ","
    df = pd.read_csv(path, sep=sep, index_col=0)
    cell_names = list(df.index.astype(str))
    feature_names = list(df.columns.astype(str))
    array = df.values.astype(np.float32)
    return array, cell_names, feature_names


def load_h5(path):
    """Load HDF5 file (10x Genomics or generic). Returns (array, cell_names, feature_names)."""
    import h5py

    with h5py.File(path, "r") as f:
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

    return array, cell_names, feature_names


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
    return array, cell_names, feature_names


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
