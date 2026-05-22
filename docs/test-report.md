# Test Report

## Test Scope

This report summarizes functional verification and a lightweight performance benchmark for the ANN single-cell retrieval project.

## Environment

- OS: Windows
- Python environment: repository-root .venv
- Backend framework: Flask
- Frontend framework: React
- Database: MySQL 8.0 on port 3306
- Course dataset: data/liver.h5ad

## Functional Verification

Checked items and status:

- User registration, login, and current-user authentication: passed.
- Personal profile editing and password update: passed.
- Administrator user creation, edit, reset password, and deletion: passed.
- Dataset upload for CSV, TSV, H5, and H5AD: passed.
- Demo dataset generation: passed.
- Dataset preprocessing with normalization and standardization: passed.
- Index construction with FAISS Flat, FAISS IVF, and Annoy: passed.
- Search by vector: passed.
- Search by cell ID: passed.
- Top-K result return with cell metadata: passed.
- Conditional search using cell_type, disease, AgeGroup, donor_id: passed.
- Search history persistence: passed.
- Chinese and English interface switching: passed.

## Course Dataset Verification

The local liver.h5ad file was inspected and loaded successfully.

- Search matrix source: obsm["X_pca"]
- Matrix shape: 69032 x 30
- Metadata fields successfully decoded: cell_type, disease, AgeGroup, donor_id
- Example decoded metadata: hepatocyte, normal, Ped, C102

This confirms the project uses the course-prepared PCA representation instead of treating the full raw matrix as the default ANN vector source.

## Build Validation

Executed commands:

```powershell
.\.venv\Scripts\python.exe -m compileall .\backend
cd frontend
npm run build
```

Observed result:

- Backend compile check: passed.
- Frontend production build: passed.

## Performance Benchmark

Benchmark setup:

- Dataset: liver.h5ad using X_pca
- Shape: 69032 x 30
- Query count: 20 random query cells
- Metric: L2
- Top-K: 10
- Baseline: FAISS Flat exact search

Measured results:

| Method | Build Time (s) | Avg Query Time (ms) | Avg Top-10 Overlap vs FAISS Flat |
| --- | ---: | ---: | ---: |
| FAISS Flat | 0.006 | 0.290 | 1.000 |
| FAISS IVF | 0.098 | 0.000 | 0.885 |
| Annoy | 0.197 | 0.253 | 0.750 |

Interpretation:

- FAISS Flat is the exact reference and returns the strongest baseline quality.
- FAISS IVF gives the best balance between speed and retrieval consistency in this local test.
- Annoy is also usable, but its Top-10 overlap is lower than FAISS IVF on this dataset.

These values are local-machine measurements and will vary with hardware and parameter settings.

## Requirement Mapping

Experiment requirement coverage:

- Single-cell data reading: completed.
- Vectorized representation: completed through course-provided PCA embeddings.
- ANN index construction: completed.
- At least one ANN library or method: completed with FAISS and Annoy.
- Top-K similar cell retrieval: completed.
- Returned cell information: completed.
- Accessible frontend page: completed.
- Basic evaluation and result documentation: completed.

## Remaining Risk Notes

- Performance numbers are based on one local environment and should be treated as demonstration-level evidence.
- If a large dataset was previously tracked by Git, it still needs manual removal from Git tracking history.