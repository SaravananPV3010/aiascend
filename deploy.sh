#!/bin/bash
# deploy.sh
# Run this script on your EC2 instance ONCE to set everything up.
# After the initial setup, just push code changes and run: pm2 restart all
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh <EC2_PUBLIC_IP_OR_DOMAIN>
#
# Example:
#   ./deploy.sh 54.123.45.67
#   ./deploy.sh app.yourdomain.com

set -e  # exit on any error

# ─── Config ───────────────────────────────────────────────────────────────────
APP_HOST="${1:-localhost}"           # EC2 public IP or domain (passed as arg)
APP_URL="http://${APP_HOST}"         # PillMate app public URL
LANDING_URL="http://${APP_HOST}"     # Landing page public URL (same IP, Nginx routes it)
REPO_DIR="/home/ubuntu/aiascend"     # Where the repo lives on EC2

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  PillMate EC2 Deployment"
echo "  Host: $APP_HOST"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 1. System dependencies ───────────────────────────────────────────────────
echo "[ 1/7 ] Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y nginx git curl

# ─── 2. Node.js (via nvm) ─────────────────────────────────────────────────────
echo "[ 2/7 ] Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  echo "  Node.js already installed: $(node -v)"
fi

# ─── 3. PM2 ───────────────────────────────────────────────────────────────────
echo "[ 3/7 ] Installing PM2..."
npm install -g pm2

# ─── 4. Environment files ─────────────────────────────────────────────────────
echo "[ 4/7 ] Writing environment files..."

# Landing page → points to the pillmate app running behind Nginx
cat > "$REPO_DIR/landing_page/.env.production" <<EOF
NEXT_PUBLIC_PILLMATE_APP_URL=${APP_URL}
EOF

# PillMate app → add your Gemini + Firebase keys here
# (Copy your local .env values into this block)
if [ ! -f "$REPO_DIR/pillmate/.env" ]; then
  echo "  ⚠  WARNING: $REPO_DIR/pillmate/.env not found."
  echo "     Create it manually with your GEMINI_API_KEY and Firebase credentials."
fi

# ─── 5. Install dependencies & build ──────────────────────────────────────────
echo "[ 5/7 ] Installing dependencies and building apps..."

# PillMate app
cd "$REPO_DIR/pillmate"
npm install
npm run build

# Landing page
cd "$REPO_DIR/landing_page"
npm install
npm run build

# ─── 6. Nginx ─────────────────────────────────────────────────────────────────
echo "[ 6/7 ] Configuring Nginx..."
sudo cp "$REPO_DIR/nginx.conf" /etc/nginx/sites-available/pillmate
sudo ln -sf /etc/nginx/sites-available/pillmate /etc/nginx/sites-enabled/pillmate
sudo rm -f /etc/nginx/sites-enabled/default   # remove default placeholder

sudo nginx -t   # validate config
sudo systemctl restart nginx
sudo systemctl enable nginx

# ─── 7. PM2 ───────────────────────────────────────────────────────────────────
echo "[ 7/7 ] Starting apps with PM2..."
cd "$REPO_DIR"
pm2 delete all 2>/dev/null || true   # clear any previous processes
pm2 start ecosystem.config.js
pm2 save                             # persist process list
pm2 startup systemd -u ubuntu --hp /home/ubuntu   # auto-start on reboot

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  Deployment complete!"
echo ""
echo "  Landing page  →  http://${APP_HOST}"
echo "  PillMate app  →  http://${APP_HOST}/app"
echo ""
echo "  Useful PM2 commands:"
echo "    pm2 status          see app status"
echo "    pm2 logs            stream all logs"
echo "    pm2 restart all     restart after code change"
echo "═══════════════════════════════════════════════════════"
echo ""
