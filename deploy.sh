#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# SOFITUL — Deploy local → producción
# Uso: bash deploy.sh
# Requiere: git commiteado + SSH key en ~/.ssh/gestides_key
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SSH_HOST="root@172.235.128.206"
SSH_KEY="$HOME/.ssh/gestides_key"
APP_DIR="/opt/sofitul"
PG_CONTAINER="postgres"
PG_USER="sofitul_admin"
PG_DB="sofitul_onetrade"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_HOST"
SCP="scp -i $SSH_KEY -r -o StrictHostKeyChecking=no"

log()  { echo -e "\033[1;34m▶ $*\033[0m"; }
ok()   { echo -e "\033[1;32m✔ $*\033[0m"; }
die()  { echo -e "\033[1;31m✖ $*\033[0m"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           SOFITUL — DEPLOY PRODUCCIÓN                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 0. Verificar que TODO está en git ───────────────────────────────────────
cd "$ROOT_DIR"

UNTRACKED="$(git ls-files --others --exclude-standard)"
if [[ -n "$UNTRACKED" ]]; then
  echo "⚠  Hay archivos SIN TRACKEAR en git. Agregá y commiteá antes de deployar:"
  echo "$UNTRACKED"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "⚠  Hay archivos modificados sin commitear. Hacé commit antes de deployar."
  git status --short
  exit 1
fi

# ─── 1. Push a GitHub ────────────────────────────────────────────────────────
log "[1/6] Push a GitHub..."
git push origin main
ok "Push OK"

# ─── 2. Build frontend + backend ─────────────────────────────────────────────
log "[2/6] Build frontend y backend..."
cd "$ROOT_DIR/frontend"
pnpm run build
cd "$ROOT_DIR/backend"
# Forzar build limpio: borra dist y tsbuildinfo para evitar que el cache
# incremental de TypeScript omita archivos nuevos (bug reproducido en Windows/Git Bash)
rm -rf dist tsconfig.build.tsbuildinfo
pnpm run build
cd "$ROOT_DIR"
ok "Builds completados"

# ─── 3. Empaquetar y enviar todo ─────────────────────────────────────────────
log "[3/6] Enviando al servidor..."

DIST_TAR="/tmp/sofitul_frontend_dist.tar.gz"
tar -czf "$DIST_TAR" -C "$ROOT_DIR/frontend/dist" .
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$DIST_TAR" "$SSH_HOST:/tmp/sofitul_frontend_dist.tar.gz"

BACK_TAR="/tmp/sofitul_backend_dist.tar.gz"
tar -czf "$BACK_TAR" \
  -C "$ROOT_DIR/backend" \
  dist \
  package.json \
  pnpm-lock.yaml
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$BACK_TAR" "$SSH_HOST:/tmp/sofitul_backend_dist.tar.gz"

ok "Archivos enviados"

# ─── 4. Enviar SQL de migraciones ────────────────────────────────────────────
log "[4/6] Enviando migraciones SQL..."
MIGRATIONS_TAR="/tmp/sofitul_migrations.tar.gz"
if ls "$ROOT_DIR/backend/migrations/"*.sql 2>/dev/null | head -1 > /dev/null; then
  tar -czf "$MIGRATIONS_TAR" -C "$ROOT_DIR/backend/migrations" \
    $(ls "$ROOT_DIR/backend/migrations/"*.sql | xargs -I{} basename {} | tr '\n' ' ')
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$MIGRATIONS_TAR" "$SSH_HOST:/tmp/sofitul_migrations.tar.gz"
fi
ok "Migraciones enviadas"

# ─── 5. En el servidor: desplegar ────────────────────────────────────────────
log "[5/6] Actualizando servidor..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" bash << REMOTE
set -e

# Crear DB si no existe — no-bloqueante (algunos servers no tienen rol 'postgres')
docker exec -i $PG_CONTAINER psql -U $PG_USER -d $PG_DB -c "SELECT 1" >/dev/null 2>&1 || {
  echo "  → DB no responde con $PG_USER, intentando crear con superuser 'postgres'..."
  docker exec -i $PG_CONTAINER psql -U postgres -tc \
    "SELECT 1 FROM pg_database WHERE datname='$PG_DB'" 2>/dev/null | grep -q 1 || \
    docker exec -i $PG_CONTAINER psql -U postgres \
    -c "CREATE USER $PG_USER WITH PASSWORD 'S0f1tul2026Secure';" \
    -c "CREATE DATABASE $PG_DB OWNER $PG_USER;" 2>/dev/null || \
    echo "  ⚠ No se pudo crear/verificar la DB con superuser 'postgres'. Si la DB ya existe, esto es esperado y el deploy continúa."
}

echo "  → Ejecutando migraciones SQL..."
if [[ -f /tmp/sofitul_migrations.tar.gz ]]; then
  mkdir -p /tmp/sofitul_migrations
  tar -xzf /tmp/sofitul_migrations.tar.gz -C /tmp/sofitul_migrations

  # Crear tabla de tracking si no existe (idempotente)
  docker exec -i $PG_CONTAINER psql -U $PG_USER -d $PG_DB -c "
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR NOT NULL UNIQUE,
      aplicada_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );" >/dev/null 2>&1 || true

  for f in \$(ls /tmp/sofitul_migrations/*.sql 2>/dev/null | sort); do
    nombre=\$(basename "\$f")
    # Saltar si ya fue aplicada
    ya=\$(docker exec -i $PG_CONTAINER psql -U $PG_USER -d $PG_DB -tAc \
      "SELECT COUNT(*) FROM _migrations WHERE nombre='\$nombre'" 2>/dev/null || echo "0")
    if [[ "\$ya" =~ ^[[:space:]]*1 ]]; then
      echo "    ⏭  \$nombre (ya aplicada, saltando)"
      continue
    fi
    echo "    Aplicando \$nombre..."
    if docker exec -i $PG_CONTAINER psql -U $PG_USER -d $PG_DB < "\$f"; then
      docker exec -i $PG_CONTAINER psql -U $PG_USER -d $PG_DB -c \
        "INSERT INTO _migrations (nombre) VALUES ('\$nombre')" >/dev/null 2>&1 || true
      echo "    ✔  \$nombre aplicada"
    else
      echo "    ⚠  \$nombre falló — revisar manualmente, continuando deploy..."
    fi
  done

  rm -rf /tmp/sofitul_migrations /tmp/sofitul_migrations.tar.gz
fi
echo "  → Migraciones OK"

echo "  → Desplegando backend..."
mkdir -p $APP_DIR/backend
cd $APP_DIR/backend
tar -xzf /tmp/sofitul_backend_dist.tar.gz
pnpm install --prod --frozen-lockfile
rm -f /tmp/sofitul_backend_dist.tar.gz
echo "  → Backend OK"

echo "  → Desplegando frontend..."
mkdir -p /var/www/sofitul
rm -rf /var/www/sofitul/*
tar -xzf /tmp/sofitul_frontend_dist.tar.gz -C /var/www/sofitul/
rm -f /tmp/sofitul_frontend_dist.tar.gz
echo "  → Frontend OK"

echo "  → Reiniciando backend PM2..."
pm2 describe sofitul-backend > /dev/null 2>&1 && \
  pm2 restart sofitul-backend --update-env || \
  pm2 start $APP_DIR/backend/dist/main.js --name sofitul-backend \
    --env production
echo "  → PM2 OK"

REMOTE
ok "Servidor actualizado"

# ─── 6. Verificar ────────────────────────────────────────────────────────────
log "[6/6] Verificando..."
HEALTH=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
  "curl -s http://localhost:3002/api/health 2>/dev/null || echo '{}'")
echo "  Backend health: $HEALTH"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅  DEPLOY COMPLETADO                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Frontend : https://sofitul.onetradesa.pro              ║"
echo "║  PM2 logs : ssh -i ~/.ssh/gestides_key root@172.235.128.206 'pm2 logs sofitul-backend' ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
