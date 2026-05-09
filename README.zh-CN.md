# SE-Group13-Project

本项目为南开大学 2025-2026 春季学年刘健老师课程班级第 13 小组大作业。

---

# ANN Search - 单细胞数据分析

这是一个面向高维单细胞基因组数据的全栈 Web 应用，用于进行近似最近邻（ANN）检索。用户可以上传 scRNA-seq 数据集，构建基于 FAISS 或 Annoy 的高效索引，并以毫秒级速度进行交互式近邻查询。

---

## 功能特性

- 用户认证：基于 JWT 的注册与登录
- 数据集管理：支持上传 CSV、TSV、HDF5（10x Genomics）或 H5AD 文件，单文件最大 100 MB
| 后端 | Python 3.9+、Flask 2.3、Flask-JWT-Extended、Flask-SQLAlchemy、PyMySQL、FAISS-CPU、Annoy、NumPy、Pandas、h5py |
- 数据预处理：支持 L2 归一化或按特征标准化
| 存储 | MySQL 元数据 + NumPy .npy 数组 + ANN 索引文件 |
  - FAISS Flat（精确检索，支持 L2 或内积）
  - FAISS IVF（近似检索，适合大规模数据）
  - Annoy（基于树结构，内存占用较低）
- MySQL 8.0+（默认端口 3306）
  - 支持按细胞 ID 或名称查询
  - 支持配置 k 值与距离度量方式（L2、余弦、内积）
- 丰富的结果展示：包含排序结果表、距离柱状图与 CSV 导出
- 搜索历史：为每位用户保留最近 10 次查询记录

---

## 技术栈

| 层级 | 技术 |
| ---- | ---- |
| 后端 | Python 3.9+、Flask 2.3、Flask-JWT-Extended、Flask-SQLAlchemy、PyMySQL、FAISS-CPU、Annoy、NumPy、Pandas、h5py |
| 前端 | React 18、React Router 6、Material UI 5、Recharts、Axios |
| 存储 | MySQL 元数据 + NumPy .npy 数组 + ANN 索引文件 |

---

## 环境要求

- Python 3.9+
- Node.js 16+ 和 npm
- MySQL 8.0+（默认端口 3306）

---

## 安装与启动

后端和前端请分别在两个终端中运行。下面的命令按 Windows PowerShell 编写，并统一使用仓库根目录下的 `.venv` 作为标准 Python 虚拟环境。

### 数据库初始化

项目现在使用 MySQL 存储用户、数据集、索引和搜索历史等元数据。高维向量本体和 ANN 索引文件仍保存在磁盘中。

1. 启动 MySQL，并确认监听端口为 3306。
2. 创建数据库：

```sql
CREATE DATABASE ann_search CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 基于 [backend/.env.example](backend/.env.example) 创建 `backend/.env`，至少填写：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ann_search
DB_USER=root
DB_PASSWORD=your-mysql-password
```

4. 如果需要首次自动创建管理员账号，可以继续填写：

```env
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

说明：后端启动时会自动创建元数据表，但不会自动创建数据库本身，因此 `ann_search` 需要你先在 MySQL 中创建。

### 后端

```bash
cd .

# 首次初始化
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt

# 启动后端
python .\backend\app.py
```

API 服务默认启动在 http://localhost:5000。

如果 PowerShell 因执行策略无法激活脚本，可以直接使用虚拟环境解释器：

```bash
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
.\.venv\Scripts\python.exe .\backend\app.py
```

### 前端

```bash
cd frontend

# 首次初始化
npm install

# 启动前端
npm start
```

React 开发服务器默认启动在 http://localhost:3000。

### 日常启动流程

完成首次初始化后，后续标准启动命令如下。

终端 1：

```bash
cd .
.\.venv\Scripts\Activate.ps1
python .\backend\app.py
```

终端 2：

```bash
cd frontend
npm start
```

### 一键启动与关闭脚本

项目根目录下的脚本已统一存放在 scripts 文件夹中。

一键启动：

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\start_project.ps1
```

一键关闭：

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\stop_project.ps1
```

说明：

1. start_project.ps1 会检查 3000 和 5000 端口，避免重复启动。
2. stop_project.ps1 会关闭占用 3000 和 5000 端口的前后端进程。
3. 两个脚本都需要在项目根目录执行，或使用项目根目录下的相对路径调用。

---

## 使用方法

1. 打开 http://localhost:3000 并注册新账户。
2. 进入 Dashboard -> Data Management，然后选择以下任一方式：
   - 上传 CSV、TSV 或 H5 文件；
   - 点击 Generate Demo Data 立即生成测试数据。
3. 可选：对数据集进行预处理（L2 归一化或标准化）。
4. 在 Build ANN Index 区域中，选择数据集、索引类型和距离度量方式，然后点击 Build Index。
5. 进入 Search 页面，选择索引，输入查询向量或细胞 ID，设置 k 值后执行搜索。
6. 在结果表和距离柱状图中查看排序结果，并在需要时导出为 CSV。

---

## API 概览

所有接口均以 /api 为前缀。

### 认证

POST /api/auth/register · POST /api/auth/login · GET /api/auth/me

### 数据

POST /api/data/upload · POST /api/data/generate_demo · GET /api/data/datasets · DELETE /api/data/datasets/<id> · POST /api/data/datasets/<id>/preprocess

### 索引

POST /api/index/build · GET /api/index/list · GET /api/index/<id> · DELETE /api/index/<id>

### 搜索

POST /api/search/query · POST /api/search/query_by_id · GET /api/search/history

---

## 项目结构

```text
.
├── backend/
│   ├── app.py              # Flask 应用工厂与启动入口
│   ├── config.py           # 配置常量
│   ├── .env.example        # 数据库与管理员配置模板
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py     # SQLAlchemy 数据库实例
│   │   ├── metadata.py     # 数据集、索引、搜索历史模型
│   │   └── user.py         # 用户模型与管理员初始化
│   ├── routes/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── data.py         # /api/data/*
│   │   ├── index.py        # /api/index/*
│   │   └── search.py       # /api/search/*
│   ├── services/
│   │   ├── ann_service.py  # FAISS / Annoy 封装
│   │   └── data_service.py # CSV / HDF5 读取与处理
│   └── storage/            # 运行时数据目录（上传文件与索引文件）
├── frontend/
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js          # 路由与认证上下文
│       ├── api/client.js   # Axios API 客户端
│       ├── components/     # 可复用组件
│       └── pages/          # 页面级视图
└── README.md
```

---

## 环境变量（可选）

在 [backend/.env.example](backend/.env.example) 基础上创建 `backend/.env` 文件：

```env
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

## 运行测试

```bash
cd .
.\.venv\Scripts\Activate.ps1
python -m pytest .\backend
```