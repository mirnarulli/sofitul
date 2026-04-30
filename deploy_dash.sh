#!/bin/bash
set -e

# ── Backend ──────────────────────────────────────────────────
pm2 stop sofitul-backend 2>/dev/null || true
rm -rf /tmp/sofitul-be-new && mkdir /tmp/sofitul-be-new
cd /tmp/sofitul-be-new && unzip -q /tmp/sofitul-be.zip
rm -rf /opt/sofitul/backend/dist_old
mv /opt/sofitul/backend/dist /opt/sofitul/backend/dist_old 2>/dev/null || true
mkdir -p /opt/sofitul/backend/dist
cp -r /tmp/sofitul-be-new/. /opt/sofitul/backend/dist/
pm2 start sofitul-backend

# ── Frontend ─────────────────────────────────────────────────
rm -rf /tmp/sofitul-fe-new && mkdir /tmp/sofitul-fe-new
cd /tmp/sofitul-fe-new && unzip -q /tmp/sofitul-fe.zip
rm -f /var/www/sofitul/assets/*.js /var/www/sofitul/assets/*.css
cp -r /tmp/sofitul-fe-new/. /var/www/sofitul/

pm2 save
echo "Deploy OK"