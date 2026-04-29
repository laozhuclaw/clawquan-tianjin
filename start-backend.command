#!/bin/bash
# 双击这个文件即可启动 ClawQuan 后端 (FastAPI on :8000)
# 首次运行会自动安装 Python 依赖.

set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  ClawQuan 后端启动 (FastAPI :8000)"
echo "============================================"

# 找到 python3
if ! command -v python3 &> /dev/null; then
  echo "❌ 没检测到 python3. 请先安装 Python 3.10+."
  echo "   brew install python@3.11"
  read -n 1 -s -r -p "按任意键关闭窗口..."
  exit 1
fi

PY=$(command -v python3)
echo "✅ Python: $PY ($($PY --version))"

# 依赖检查 — 缺了就装
NEED_INSTALL=0
$PY -c "import fastapi, uvicorn, sqlalchemy, bcrypt, jose, passlib, pydantic" 2>/dev/null || NEED_INSTALL=1

if [ "$NEED_INSTALL" = "1" ]; then
  echo ""
  echo "📦 首次运行, 安装依赖..."
  $PY -m pip install --user -r app/requirements.txt
fi

# 种子数据 (幂等: seed 内部检查是否已有)
if [ ! -f "clawquan.db" ]; then
  echo ""
  echo "🌱 初始化数据库 + 种子数据..."
  $PY -m app.seed
fi

echo ""
echo "🚀 启动 uvicorn (按 Ctrl+C 停止)"
echo "   http://localhost:8000/docs  API 文档"
echo ""

exec $PY -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
