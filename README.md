# shangan
# 考研上岸概率计算器，本地部署版

基于 Excel 模型的考研上岸概率计算器网页版，支持多人使用、AI 备考建议（自动）、数据存储。

## 技术栈

- **前端**：HTML + CSS + JavaScript（纯静态，无需构建）
- **后端**：Python FastAPI
- **数据库**：MySQL
- **AI**：DeepSeek（API Key 配置在后端，用户无感知）

## 快速部署

### 1. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 MySQL

```bash
mysql -u root -p < init_db.sql
```

修改 `config.py` 中的数据库连接信息：

```python
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "你的密码",
    "database": "kaoyan_calculator",
}
```

### 3. 配置 DeepSeek API Key

在 `config.py` 中填入你的 DeepSeek API Key：

```python
AI_CONFIG = {
    "endpoint": "https://api.deepseek.com/v1",
    "api_key": "sk-你的DeepSeek密钥",
    "model": "deepseek-chat",
}
```

也可以用环境变量：

```bash
export AI_API_KEY=sk-你的DeepSeek密钥
```

### 4. 启动服务

```bash
python main.py
```

服务默认运行在 `http://0.0.0.0:8000`，浏览器打开即可使用。

## API 说明

| 路由 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 前端页面 |
| `/api/save` | POST | 存储用户评估数据 |
| `/api/ai-advice` | POST | 生成 AI 备考建议（使用预配置 Key） |
| `/api/stats` | GET | 汇总统计（供你分析） |

## 用户使用流程

1. 填写 12 个维度的下拉选项（8 客观 + 4 主观）
2. 点击「生成我的上岸概率」按钮
3. 页面显示上岸概率（仪表盘 + 颜色预警）
4. AI 自动生成针对性备考建议

用户全程不需要接触任何 API Key 或算法细节。

## 也可以用环境变量配置

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=你的密码
export DB_NAME=kaoyan_calculator
export AI_API_KEY=sk-你的DeepSeek密钥
export AI_MODEL=deepseek-chat
```
