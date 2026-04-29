#!/bin/bash
# 双击这个文件即可启动 ClawQuan 前端 (Next.js dev on :3000)
# 首次运行会自动 npm install.

set -e
cd "$(dirname "$0")/web"

echo "============================================"
echo "  ClawQuan 前端启动 (Next.js :3000)"
echo "============================================"

# 找到 node/npm
if ! command -v node &> /dev/null; then
  echo "❌ 没检测到 node. 请先安装 Node.js 18+."
  echo "   brew install node"
  read -n 1 -s -r -p "按任意键关闭窗口..."
  exit 1
fi

echo "✅ Node:  $(node --version)"
echo "✅ npm:   $(npm --version)"

# 检查 next 是否装好 (沙箱里 node_modules 不完整, 用 next 做标志)
if [ ! -f "node_modules/next/package.json" ]; then
  echo ""
  echo "📦 首次运行, 安装前端依赖 (可能要 1-2 分钟)..."
  rm -rf node_modules package-lock.json
  npm install
fi

# .env.local 指向本地后端
if [ ! -f ".env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
  echo "✅ 已创建 .env.local -> http://localhost:8000"
fi

echo ""
echo "🚀 启动 Next.js dev server (按 Ctrl+C 停止)"
echo "   http://localhost:3000"
echo ""

exec npm run dev
