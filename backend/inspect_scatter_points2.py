from routes import data
from routes.data import _load_dataset_array, _load_or_build_dataset_scatter_method
p='a4d9e3f7-1ad1-4dbf-a021-cb037607fac0'
array, cell_names, feature_names, cell_metadata = _load_dataset_array(p)
print('array shape', array.shape)
payload = _load_or_build_dataset_scatter_method(p, method='umap')
coords = payload['coords']
labels = payload['labels']
print('coords shape', coords.shape)
print('labels shape', labels.shape)
points = []
for idx in range(0, min(10, coords.shape[0])):
    coord = coords[idx]
    cluster_id = int(labels[idx]) if idx < len(labels) else 0
    point = {
        'x': float(coord[0]),
        'y': float(coord[1]),
        'cluster': int(cluster_id),
        'cell_id': int(idx),
        'cell_name': cell_names[idx] if idx < len(cell_names) else f'cell_{idx}',
    }
    if idx < len(cell_metadata) and isinstance(cell_metadata[idx], dict):
        point.update(cell_metadata[idx])
    points.append(point)

import json
print('sample points:')
for pnt in points:
    print(json.dumps(pnt, ensure_ascii=False))

# collect unique values for disease
values = set()
for pnt in points:
    values.add(pnt.get('disease'))
print('unique disease in sample:', values)
