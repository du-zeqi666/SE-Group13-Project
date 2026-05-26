# SE-Group13-Project

本项目为南开大学 2025-2026 春季学年软件工程课程第 13 组大作业。

English version: [README.md](README.md)

---

## ANN Search - 单细胞数据分析

这是一个面向高维单细胞数据的全栈 Web 应用，支持数据集上传、预处理、近似最近邻索引构建、交互式检索、个人账户管理，以及管理员侧的用户管理。

---

## 主要功能

- 基于 JWT 的注册、登录和当前用户鉴权
- 个人信息管理，支持修改用户名、邮箱和密码
- 管理员可创建、编辑、重置密码和删除普通用户
- 支持 CSV、TSV、HDF5、H5AD 数据集上传，并可一键生成演示数据
- 支持 L2 归一化和按特征标准化的数据预处理
- 支持构建 FAISS Flat、FAISS IVF 和 Annoy 索引
- 基于 ChromaDB HNSW 的多数据集联合索引构建，支持跨数据集检索
- 基于 RAG 的自然语言 AI 智能检索，自动提取元数据条件并返回分析解读
- 支持按原始向量或按细胞 ID 检索，并可配置 k 值、距离度量和元数据过滤条件
- 支持结果排序展示、图表展示、CSV 导出和最近搜索历史
- 前端支持中英文界面切换
- 补充了开发文档、用户手册和测试报告

---

## 架构说明

| 层级 | 技术 |
| --- | --- |
| 后端 | Python 3.9+、Flask 2.3、Flask-CORS、Flask-JWT-Extended、Flask-SQLAlchemy、PyMySQL |
| ANN / 数据处理 | FAISS-CPU、Annoy、ChromaDB、NumPy、Pandas、h5py、scikit-learn、sentence-transformers |
| 前端 | React 18、React Router 6、Material UI 5、Axios、Recharts |
| 存储 | MySQL 元数据 + 本地数据文件 + 本地 ANN 索引文件 |

用户、数据集、索引和搜索历史等元数据存储在 MySQL 中；高维数组和 ANN 索引文件保存在 `backend/storage` 目录下。

---

## 环境要求

- Python 3.9+
- Node.js 16+ 和 npm
- MySQL 8.0+，端口 3306
- Windows PowerShell，用于执行下方命令

---

## 快速开始

### 1. 创建 MySQL 数据库

```sql
CREATE DATABASE ann_search CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 创建 `backend/.env`

先复制后端环境变量模板：

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

至少填写：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ann_search
DB_USER=root
DB_PASSWORD=your-mysql-password
```

如果希望首次启动时自动创建管理员账号，还需要填写：

```env
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

每个字段的详细说明见 [backend/.env.example](backend/.env.example)。如果管理员相关字段留空，系统不会自动创建管理员账号。

### 3. 可选：创建 `frontend/.env.local`

前端默认请求 `http://localhost:5000`。只有当后端地址不是这个默认值时，才需要创建该文件：

```powershell
Copy-Item .\frontend\.env.local.example .\frontend\.env.local
```

然后修改：

```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. 初始化并启动后端

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt
python .\backend\app.py
```

如果 PowerShell 因执行策略无法激活脚本，可以直接使用虚拟环境解释器：

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
.\.venv\Scripts\python.exe .\backend\app.py
```

后端地址：`http://localhost:5000`

### 5. 初始化并启动前端

```powershell
cd frontend
npm install
npm start
```

前端地址：`http://localhost:3000`

### 6. 可选：使用一键脚本

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_project.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\stop_project.ps1
```

---

## 本地文件与自动生成目录

| 路径 | 本地是否需要 | 生成方式 |
| --- | --- | --- |
| `backend/.env` | 需要 | 复制 [backend/.env.example](backend/.env.example) 后填写本机配置 |
| `frontend/.env.local` | 按需 | 仅在需要修改前端 API 地址时，复制 [frontend/.env.local.example](frontend/.env.local.example) |
| `data/` | 可选但建议保留 | 用于存放课程原始数据等大文件；保留说明文档，不提交原始 `.h5ad` |
| `.venv/` | 需要 | 执行 `python -m venv .venv` |
| `node_modules/` | 需要 | 在 `frontend` 目录执行 `npm install` |
| `build/` | 按需 | 在 `frontend` 目录执行 `npm run build` |
| `backend/storage/` | 运行时生成 | 由上传、预处理、建索引等操作自动生成 |
| `__pycache__/`、`*.pyc`、`*.pyo`、`*.pyd` | 不需要手工处理 | 由 Python 自动生成 |

### 课程数据存放路径

如果你在本地使用课程提供的肝脏单细胞数据，建议统一放在 `data/` 目录，例如：

```text
data/
├── liver.h5ad
└── 数据说明.md
```

其中大型原始数据文件会被 `.gitignore` 忽略，不应提交到仓库；建议只保留 [data/数据说明.md](data/数据说明.md) 这类轻量说明文件。

### 针对课程 `.h5ad` 数据的推荐处理方式

对当前提供的 `liver.h5ad`，更符合课程要求的 ANN 输入不是原始表达矩阵，而是文件里已经准备好的 `obsm["X_pca"]` PCA 表示。

在本项目中的推荐映射方式如下：

1. 使用 `obsm["X_pca"]` 作为构建 ANN 索引的细胞向量矩阵。
2. 使用 `obs` 中的 `cell_type`、`disease`、`AgeGroup` 等字段作为返回细胞信息和后续条件检索字段。
3. 使用 `obsm["X_umap"]` 或 `obsm["X_tsne"]` 做可视化，不建议直接作为主检索向量。
4. 原始 `X` 表达矩阵保留为源数据，需要时再使用，但不建议默认直接用于检索，因为维度更高、开销更大。

说明：当前后端上传链路已经支持通用 CSV/TSV/HDF5 输入，但这份课程 `.h5ad` 数据是结构化的 AnnData 文件，且包含现成降维结果。若要完全贴合课程数据设计，后端加载逻辑应优先读取 `obsm["X_pca"]` 和选定的 `obs` 元数据字段。

---

## 日常启动命令

手动启动：

终端 1：

```powershell
.\.venv\Scripts\Activate.ps1
python .\backend\app.py
```

终端 2：

```powershell
cd frontend
npm start
```

脚本启动：

```powershell
.\scripts\start_project.ps1
.\scripts\stop_project.ps1
```

启动脚本会检查 3000 和 5000 端口，避免重复启动；关闭脚本会结束占用这两个端口的前后端进程。

---

## 使用流程

1. 打开 `http://localhost:3000`。
2. 注册普通用户，或使用 `backend/.env` 中配置的管理员账号登录。
3. 进入 Dashboard 上传数据集，或者直接生成演示数据。
4. 根据需要对数据集做预处理。
5. 为数据集构建 FAISS 或 Annoy 索引。
6. 可选：构建联合索引，合并多个数据集（支持跨数据集 RAG 检索）。
7. 在 Search 页面中按向量、按细胞 ID 或自然语言（AI 智能检索）发起检索。
8. 查看排序结果、图表、AI 分析、CSV 导出和最近搜索历史。
9. 在 Profile 页面维护自己的账户信息。
10. 如果是管理员，可在 User Management 页面管理普通用户。

---

## API 概览

所有接口均以 `/api` 为前缀。

- 认证：`POST /api/auth/register`、`POST /api/auth/login`、`GET /api/auth/me`
- 用户：`PATCH /api/users/me`、`PATCH /api/users/me/password`、`GET /api/users`、`POST /api/users`、`PATCH /api/users/<id>`、`PATCH /api/users/<id>/password`、`DELETE /api/users/<id>`
- 数据：`POST /api/data/upload`、`POST /api/data/generate_demo`、`GET /api/data/datasets`、`DELETE /api/data/datasets/<id>`、`POST /api/data/datasets/<id>/preprocess`
- 索引：`POST /api/index/build`、`GET /api/index/list`、`GET /api/index/<id>`、`DELETE /api/index/<id>`
- 联合索引：`POST /api/joint/build`、`GET /api/joint/list`、`GET /api/joint/<id>`、`DELETE /api/joint/<id>`、`POST /api/joint/query`、`GET /api/joint/<id>/datasets`
- RAG：`POST /api/rag/search`、`POST /api/rag/analyze`
- 搜索：`POST /api/search/query`、`POST /api/search/query_by_id`、`GET /api/search/history`

`POST /api/search/query` 和 `POST /api/search/query_by_id` 额外支持可选的 `filters` 对象，可按 `cell_type`、`disease`、`AgeGroup`、`donor_id` 做条件检索。RAG 搜索接受自然语言查询，并返回 AI 分析解读结果。

---

## 项目结构

```text
.
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── .env.example
│   ├── models/
│   │   ├── __init__.py
│   │   ├── metadata.py
│   │   └── user.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── data.py
│   │   ├── index.py
│   │   ├── joint.py
│   │   ├── rag.py
│   │   ├── search.py
│   │   └── users.py
│   ├── services/
│   │   ├── ann_service.py
│   │   ├── chroma_service.py
│   │   ├── data_service.py
│   │   └── rag_service.py
│   └── storage/
├── frontend/
│   ├── .env.local.example
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── api/client.js
│       ├── components/
│       │   ├── AISearchPanel.js
│       │   ├── AIResultsDisplay.js
│       │   ├── DataManagement.js
│       │   ├── IndexManagement.js
│       │   ├── JointIndexManagement.js
│       │   ├── Login.js
│       │   ├── Navbar.js
│       │   ├── Register.js
│       │   ├── ResultsDisplay.js
│       │   └── SearchPanel.js
│       ├── i18n.js
│       └── pages/
│           ├── AdminUsersPage.js
│           ├── AuthPage.js
│           ├── DashboardDataPage.js
│           ├── DashboardIndexPage.js
│           ├── DashboardPage.js
│           ├── ProfilePage.js
│           └── SearchPage.js
├── docs/
│   ├── development-guide.md
│   ├── test-report.md
│   └── user-manual.md
├── scripts/
│   ├── start_project.ps1
│   └── stop_project.ps1
├── README.md
└── README.zh-CN.md
```

---

## 校验命令

后端语法检查：

```powershell
.\.venv\Scripts\python.exe -m compileall .\backend
```

前端生产构建：

```powershell
cd frontend
npm run build
```
