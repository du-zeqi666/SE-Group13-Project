# SE-Group13-Project

该项目为南开大学2025-2026春季学年，刘健老师课程班级第13小组大作业

---

# ANN Search – Single-Cell Data Analysis

A full-stack web application for **Approximate Nearest Neighbor (ANN) search** on high-dimensional single-cell genomics data. Upload your scRNA-seq datasets, build fast FAISS or Annoy indices, and interactively query nearest neighbours in milliseconds.

---

## Features

- **User authentication** – JWT-based register/login
- **Dataset management** – Upload CSV, TSV, HDF5 (10x Genomics), or H5AD files (up to 100 MB)
- **Demo data generation** – One-click synthetic dataset (1 000 cells × 50 features) for quick testing
- **Preprocessing** – L2 normalisation or per-feature standardisation
- **Multiple ANN backends**
  - FAISS Flat (exact, L2 or inner-product)
  - FAISS IVF (approximate, scalable)
  - Annoy (tree-based, low memory)
- **Flexible search**
  - Query by raw vector (comma-separated floats)
  - Query by cell ID / name
  - Configurable k and distance metric (L2, cosine, inner product)
- **Rich results view** – ranked table + distance bar chart + CSV export
- **Search history** – last 10 queries per user

---

## Tech Stack


| Layer    | Technologies                                                                      |
| -------- | --------------------------------------------------------------------------------- |
| Backend  | Python 3.9+, Flask 2.3, Flask-JWT-Extended, Flask-SQLAlchemy, PyMySQL, FAISS-CPU, Annoy, NumPy, Pandas, h5py |
| Frontend | React 18, React Router 6, Material UI 5, Recharts, Axios                          |
| Storage  | MySQL metadata + NumPy `.npy` arrays + ANN index files                            |

---

## Prerequisites

- Python **3.9+**
- Node.js **16+** and npm
- MySQL **8.0+** on port `3306`

---

## Installation and Startup

Run the backend and frontend in two separate terminals. The commands below are written for Windows PowerShell and use a repository-level `.venv` as the standard Python environment.

### Database setup

This project now stores metadata such as users, datasets, indices, and search history in MySQL. High-dimensional vectors and ANN index files remain on disk.

1. Start MySQL and confirm it listens on port `3306`.
2. Create the database:

```sql
CREATE DATABASE ann_search CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Copy [backend/.env.example](backend/.env.example) to `backend/.env` and configure at least:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ann_search
DB_USER=root
DB_PASSWORD=your-mysql-password
```

4. If you want the first admin account to be created automatically on startup, also set:

```env
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

The administrator password comes from `ADMIN_PASSWORD` in `backend/.env`; it is not a hard-coded built-in default password.

Note: backend startup creates metadata tables automatically, but it does not create the database itself. You must create `ann_search` in MySQL first.

### Backend

```bash
cd .

# One-time setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt

# Start backend
python .\backend\app.py
```

The API server starts at `http://localhost:5000`.

If PowerShell blocks script activation, use the virtual environment interpreter directly:

```bash
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
.\.venv\Scripts\python.exe .\backend\app.py
```

### Frontend

```bash
cd frontend

# One-time setup
npm install

# Start frontend
npm start
```

The React dev server starts at `http://localhost:3000`.

### Daily startup

After the first setup, the standard startup flow is:

Terminal 1:

```bash
cd .
.\.venv\Scripts\Activate.ps1
python .\backend\app.py
```

Terminal 2:

```bash
cd frontend
npm start
```

### PowerShell script commands

If you want to start or stop the project through scripts, open PowerShell in the repository root first, then run the commands below.

Start frontend and backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_project.ps1
```

Stop frontend and backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop_project.ps1
```

If your current PowerShell session is already at the repository root, you can also run:

```powershell
.\scripts\start_project.ps1
.\scripts\stop_project.ps1
```

### One-click scripts

Project scripts are stored under the `scripts` folder in the repository root.

Start everything:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\start_project.ps1
```

Stop everything:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\stop_project.ps1
```

Notes:

1. `start_project.ps1` checks ports `3000` and `5000` to avoid duplicate startup.
2. `stop_project.ps1` stops the frontend and backend processes that are listening on ports `3000` and `5000`.
3. Run both scripts from the repository root, or call them with repository-root-relative paths.

---

## Usage

1. Open `http://localhost:3000` and register a new account.
2. Go to **Dashboard → Data Management** and either:
   - Upload a CSV/TSV/H5 file, or
   - Click **Generate Demo Data** for instant test data.
3. (Optional) Preprocess the dataset (L2 normalise or standardise).
4. Under **Build ANN Index**, select a dataset, choose an index type and metric, then click **Build Index**.
5. Navigate to **Search**, pick an index, enter a query vector or a cell ID, set k, and hit **Search**.
6. Explore ranked results in the table and the distance bar chart; export as CSV if needed.

---

## API Overview

All endpoints are prefixed with `/api`.

### Auth  `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`

### Data  `POST /api/data/upload` · `POST /api/data/generate_demo` · `GET /api/data/datasets` · `DELETE /api/data/datasets/<id>` · `POST /api/data/datasets/<id>/preprocess`

### Index `POST /api/index/build` · `GET /api/index/list` · `GET /api/index/<id>` · `DELETE /api/index/<id>`

### Search `POST /api/search/query` · `POST /api/search/query_by_id` · `GET /api/search/history`

---

## Project Structure

```
.
├── backend/
│   ├── app.py              # Flask application factory and startup entry
│   ├── config.py           # Configuration constants
│   ├── .env.example        # Database and admin config template
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py     # SQLAlchemy database instance
│   │   ├── metadata.py     # Dataset, index, and search-history models
│   │   └── user.py         # User model and admin bootstrap
│   ├── routes/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── data.py         # /api/data/*
│   │   ├── index.py        # /api/index/*
│   │   └── search.py       # /api/search/*
│   ├── services/
│   │   ├── ann_service.py  # FAISS / Annoy wrappers
│   │   └── data_service.py # CSV / HDF5 loaders
│   └── storage/            # Runtime data directory for uploads and index files
├── frontend/
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js          # Router + Auth context
│       ├── api/client.js   # Axios API client
│       ├── components/     # Reusable UI components
│       └── pages/          # Full-page views
└── README.md
```

---

## Environment Variables (optional)

Create `backend/.env` based on [backend/.env.example](backend/.env.example):

```
SECRET_KEY=your-flask-secret
JWT_SECRET_KEY=your-jwt-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ann_search
DB_USER=root
DB_PASSWORD=your-mysql-password
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

---

## Running Tests

```bash
cd .
.\.venv\Scripts\Activate.ps1
python -m pytest .\backend
```
