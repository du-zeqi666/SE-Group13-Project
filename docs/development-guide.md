# Development Guide

## Overview

This project is a full-stack ANN retrieval system for single-cell data.

- Backend: Flask API, JWT authentication, MySQL metadata storage.
- Frontend: React + Material UI single-page interface.
- Vector storage: local NumPy files under backend/storage/uploads.
- ANN index storage: local FAISS or Annoy files under backend/storage/indices.

## Core Architecture

The system uses a split-storage design.

- MySQL stores users, dataset records, index records, and search history.
- Local disk stores the actual high-dimensional vectors and ANN index artifacts.
- H5AD course data is loaded from local files and converted into searchable vectors.

This design keeps metadata query-friendly while avoiding large vector blobs in MySQL.

## Backend Modules

- backend/app.py: application factory, blueprint registration, table creation, admin bootstrap.
- backend/config.py: environment loading, MySQL connection string, storage directory settings.
- backend/models/user.py: user model, password hashing, admin initialization.
- backend/models/metadata.py: dataset, index, and search history models.
- backend/routes/auth.py: register, login, current-user endpoints.
- backend/routes/users.py: profile editing, password change, admin-side user management.
- backend/routes/data.py: dataset upload, demo generation, preprocessing, dataset listing and deletion.
- backend/routes/index.py: index build, list, detail, delete.
- backend/routes/search.py: vector search, search-by-cell, conditional filtering, history.
- backend/services/data_service.py: CSV/H5/H5AD loading, validation, preprocessing.
- backend/services/ann_service.py: FAISS Flat, FAISS IVF, Annoy build, save, load, search.

## Frontend Modules

- frontend/src/App.js: route tree, auth context, language context.
- frontend/src/api/client.js: Axios client and API wrappers.
- frontend/src/components/DataManagement.js: upload, preprocess, dataset table.
- frontend/src/components/SearchPanel.js: index selection, vector search, search-by-ID, condition filters.
- frontend/src/components/ResultsDisplay.js: result table, CSV export, distance chart, active filters.
- frontend/src/pages/SearchPage.js: integrated search page.
- frontend/src/pages/ProfilePage.js: personal information and password management.
- frontend/src/pages/AdminUsersPage.js: administrator-side user maintenance.
- frontend/src/i18n.js: Chinese and English text resources.

## Course Data Handling

The project is aligned with the course single-cell dataset requirement.

- Preferred search vectors: obsm["X_pca"] from H5AD.
- Metadata source: obs fields such as cell_type, disease, AgeGroup, donor_id.
- Visualization source: current UI uses result charts; H5AD metadata is retained for result interpretation.
- Large raw files should be kept in the local data directory and excluded from Git.

When liver.h5ad is uploaded, the backend prioritizes X_pca as the searchable matrix and attaches cell-level metadata to search results.

## Search Workflow

1. Upload a dataset or use the demo dataset.
2. Optionally preprocess the vectors.
3. Build a FAISS Flat, FAISS IVF, or Annoy index.
4. Search by raw vector or by an existing cell ID.
5. Optionally add exact-match filters for cell_type, disease, AgeGroup, and donor_id.
6. Return Top-K nearest cells with metadata and distance values.

Conditional search is implemented as ANN candidate retrieval followed by metadata filtering. This keeps the index layer simple while meeting the experiment requirement for constrained retrieval.

## Storage Layout

- backend/storage/uploads/<dataset_id>.npy: vector matrix.
- backend/storage/uploads/<dataset_id>_meta.json: cell names, feature names, cell metadata.
- backend/storage/indices/<index_id>.faiss or .ann: ANN artifact.
- data/: local course dataset directory, not committed.

## Environment Notes

- Use the repository-root .venv as the standard Python environment.
- Use backend/.env for backend configuration.
- Use frontend/.env.local only when the frontend API address differs from http://localhost:5000.
- Default MySQL target is 127.0.0.1:3306 with database ann_search.

## Requirement Coverage Summary

The current implementation covers the main experiment items.

- Single-cell dataset loading and local storage.
- Vector representation using course-provided PCA embedding.
- ANN indexing with at least one approximate nearest neighbor library.
- Top-K similar cell search.
- Cell metadata return in search results.
- Conditional retrieval based on metadata.
- Web frontend accessible to end users.
- Basic performance metrics through query timing and benchmark documentation.