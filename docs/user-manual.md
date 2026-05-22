# User Manual

## Before You Start

- Install Python 3.9 or newer.
- Install Node.js 16 or newer.
- Install and start MySQL 8.0 on port 3306.
- Place large course datasets such as liver.h5ad under the local data directory.

## Initial Setup

1. Create the Python virtual environment if it does not already exist.
2. Copy backend/.env.example to backend/.env and fill in your MySQL credentials.
3. Optionally copy frontend/.env.local.example to frontend/.env.local if the backend address is not the default local address.
4. Install backend dependencies inside .venv.
5. Install frontend dependencies in the frontend directory.

## One-Click Startup

Use the scripts directory.

- scripts/start_project.ps1: starts backend and frontend.
- scripts/stop_project.ps1: stops backend and frontend.

Start command:

```powershell
.\scripts\start_project.ps1
```

Stop command:

```powershell
.\scripts\stop_project.ps1
```

After startup, open the frontend page in your browser and access the backend through the configured API address.

## Account Usage

- Register a normal account on the login page, or use the bootstrap admin account from backend/.env.
- After login, open the profile page to edit username, email, or password.
- Administrators can open the user management page to create, edit, reset, or delete regular users.

## Dataset Workflow

1. Open the dashboard page.
2. Upload a CSV, TSV, H5, or H5AD dataset, or generate a demo dataset.
3. Confirm the dataset appears in the dataset table.
4. If needed, run normalization or standardization.

For the course liver.h5ad dataset, the backend will automatically prefer X_pca as the search matrix and keep obs metadata for result display.

## Index Workflow

1. Choose a dataset.
2. Select an index type.
3. Build a FAISS Flat, FAISS IVF, or Annoy index.
4. Wait until the index appears in the index list.

Recommended usage:

- FAISS Flat: exact baseline and small-to-medium datasets.
- FAISS IVF: faster approximate search on larger datasets.
- Annoy: lightweight approximate search with disk-friendly indexes.

## Search Workflow

1. Open the search page.
2. Select an index.
3. Choose one search mode.
4. Enter a raw vector or an existing cell ID.
5. Set Top-K and distance metric.
6. Optionally set one or more filters.
7. Run the search and inspect the ranked result table and chart.

Supported filters:

- cell_type
- disease
- AgeGroup
- donor_id

The search result page supports:

- ranked Top-K cells
- distance values
- returned cell metadata
- active filter display
- CSV export
- recent search history

## Recommended Demo Path For Course Review

1. Start the full system.
2. Log in as admin or a normal user.
3. Upload liver.h5ad from the local data directory.
4. Build a FAISS IVF or Annoy index.
5. Search by a known cell ID.
6. Add a condition such as cell_type=hepatocyte.
7. Export the results as CSV.
8. Open the admin page to demonstrate user management.

## Troubleshooting

- If backend startup fails, first check backend/.env and MySQL connectivity.
- If login fails with token or connection errors, confirm the frontend API address.
- If a cell ID search returns not found, verify the cell exists in the selected dataset.
- If no result matches the filter, broaden or clear the filter fields.