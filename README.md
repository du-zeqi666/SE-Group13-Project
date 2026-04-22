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

| Layer    | Technologies |
|----------|-------------|
| Backend  | Python 3.9+, Flask 2.3, Flask-JWT-Extended, FAISS-CPU, Annoy, NumPy, Pandas, h5py |
| Frontend | React 18, React Router 6, Material UI 5, Recharts, Axios |
| Storage  | JSON flat files + NumPy `.npy` arrays (no database required) |

---

## Prerequisites

- Python **3.9+**
- Node.js **16+** and npm

---

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API server starts at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The React dev server starts at `http://localhost:3000`.

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
│   ├── app.py              # Flask application factory
│   ├── config.py           # Configuration constants
│   ├── requirements.txt
│   ├── models/user.py      # User model + JSON store
│   ├── routes/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── data.py         # /api/data/*
│   │   ├── index.py        # /api/index/*
│   │   └── search.py       # /api/search/*
│   ├── services/
│   │   ├── ann_service.py  # FAISS / Annoy wrappers
│   │   └── data_service.py # CSV / HDF5 loaders
│   └── storage/            # Created at runtime
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

Create a `.env` file in `backend/`:

```
SECRET_KEY=your-flask-secret
JWT_SECRET_KEY=your-jwt-secret
```

---

## Running Tests

```bash
cd backend
pytest
```
