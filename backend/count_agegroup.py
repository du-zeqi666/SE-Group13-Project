from routes.data import _load_dataset_array
p='a4d9e3f7-1ad1-4dbf-a021-cb037607fac0'
array, cell_names, feature_names, cell_metadata = _load_dataset_array(p)
values = {}
for entry in cell_metadata:
    if isinstance(entry, dict):
        v = entry.get('AgeGroup','__MISSING__')
        values[v] = values.get(v,0)+1
print('AgeGroup counts:', values)
