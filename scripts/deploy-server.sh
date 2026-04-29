#!/bin/bash
set -e

# ===================================================================
# ClawQuan Server Deployment Script
# ===================================================================
# Run this script on the target server (Ubuntu 22.04+ recommended)
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Git access to clone the repository
#   - Ports 80 and 443 available
#
# Usage:
#   chmod +x scripts/deploy-server.sh
#   ./scripts/deploy-server.sh
# ===================================================================

PROJECT_DIR="/opt/clawquan"
REPO_URL="https://github.com/laozhuclaw/ClawQuan.git"

echo "=== ClawQuan Deployment ==="

# 1. Install Docker + Docker Compose if missing
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | bash
    sudo usermod -aG docker "$USER"
    echo "Docker installed. You may need to log out and back in for group changes."
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Use 'docker compose' (v2) if available, else 'docker-compose'
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# 2. Clone or update code
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Updating existing repository..."
    cd "$PROJECT_DIR"
    git pull
else
    echo "Cloning repository..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 3. Ensure .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "WARNING: Please edit .env and set a strong SECRET_KEY and POSTGRES_PASSWORD before continuing!"
    echo "Run: sudo nano $PROJECT_DIR/.env"
    exit 1
fi

# 4. Build and start services
echo "Building and starting services..."
$COMPOSE down 2>/dev/null || true
$COMPOSE up -d --build

# 5. Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "Backend is healthy!"
        break
    fi
    sleep 2
done

# 6. Seed database (optional, idempotent)
echo "Seeding database..."
$COMPOSE exec -T backend python -m app.seed || echo "Seed completed or already seeded"

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://localhost:3000 (or via Nginx on port 80)"
echo "Backend API: http://localhost:8000"
echo ""
echo "Next steps:"
echo "  1. Configure DNS: clawquan.com -> $(curl -s4 ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo "  2. Set up SSL: sudo certbot --nginx -d clawquan.com -d www.clawquan.com"
echo "  3. Update nginx-docker.conf server_name if needed"
