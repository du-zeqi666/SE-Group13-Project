# SE-Group13-Project

本项目为南开大学 2025-2026 春季学年刘健老师课程班级第 13 小组大作业。

---

# ANN Search - 单细胞数据分析

这是一个面向高维单细胞基因组数据的全栈 Web 应用，用于进行近似最近邻（ANN）检索。用户可以上传 scRNA-seq 数据集，构建基于 FAISS 或 Annoy 的高效索引，并以毫秒级速度进行交互式近邻查询。

---

## 功能特性

- 用户认证：基于 JWT 的注册与登录
- 数据集管理：支持上传 CSV、TSV、HDF5（10x Genomics）或 H5AD 文件，单文件最大 100 MB
- 演示数据生成：一键生成合成数据集（1000 个细胞 × 50 个特征），便于快速测试
- 数据预处理：支持 L2 归一化或按特征标准化
- 多种 ANN 后端：
  - FAISS Flat（精确检索，支持 L2 或内积）
  - FAISS IVF（近似检索，适合大规模数据）
  - Annoy（基于树结构，内存占用较低）
- 灵活搜索：
  - 支持直接输入原始向量查询（以逗号分隔的浮点数）
  - 支持按细胞 ID 或名称查询
  - 支持配置 k 值与距离度量方式（L2、余弦、内积）
- 丰富的结果展示：包含排序结果表、距离柱状图与 CSV 导出
- 搜索历史：为每位用户保留最近 10 次查询记录

---

## 技术栈

| 层级 | 技术 |
| ---- | ---- |
| 后端 | Python 3.9+、Flask 2.3、Flask-JWT-Extended、FAISS-CPU、Annoy、NumPy、Pandas、h5py |
| 前端 | React 18、React Router 6、Material UI 5、Recharts、Axios |
| 存储 | JSON 平面文件 + NumPy .npy 数组（无需数据库） |

---

## 环境要求

- Python 3.9+
- Node.js 16+ 和 npm

---

## 安装方式

### 后端

```bash
cd backend

# 使用虚拟环境
python3 -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python app.py
```

API 服务默认启动在 http://localhost:5000。

### 前端

```bash
cd frontend
npm install
npm start
```

React 开发服务器默认启动在 http://localhost:3000。

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
│   ├── app.py              # Flask 应用入口
│   ├── config.py           # 配置常量
│   ├── requirements.txt
│   ├── models/user.py      # 用户模型与 JSON 存储
│   ├── routes/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── data.py         # /api/data/*
│   │   ├── index.py        # /api/index/*
│   │   └── search.py       # /api/search/*
│   ├── services/
│   │   ├── ann_service.py  # FAISS / Annoy 封装
│   │   └── data_service.py # CSV / HDF5 读取与处理
│   └── storage/            # 运行时创建
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

在 backend/ 目录下创建 .env 文件：

```env
SECRET_KEY=your-flask-secret
JWT_SECRET_KEY=your-jwt-secret
```

---

## 运行测试

```bash
cd backend
pytest
```