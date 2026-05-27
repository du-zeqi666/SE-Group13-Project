from routes import data
p='a4d9e3f7-1ad1-4dbf-a021-cb037607fac0'
payload=data._load_or_build_dataset_scatter_method(p, method='umap')
pts = payload['points']
import json
print('total', len(pts))
for i,pt in enumerate(pts[:10]):
    print(i, json.dumps(pt, ensure_ascii=False))
