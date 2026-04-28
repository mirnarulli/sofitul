# SOFITUL — Instalación y Deploy

## Requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker + Docker Compose (para la DB local)
- Acceso SSH al servidor de producción

## Desarrollo local

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd sofitul
```

### 2. Levantar base de datos local

```bash
docker compose up -d db
```

Esto levanta PostgreSQL en el puerto **5433** (para no colisionar con GESTIDES en 5432).

### 3. Instalar dependencias

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 4. Configurar variables de entorno

Backend — copiar `.env.example` a `.env` y completar:
```bash
cp backend/.env.example backend/.env
```

Frontend — ya tiene `.env` por defecto apuntando a `localhost:3002`.

### 5. Aplicar migraciones

```bash
# Con la DB corriendo en Docker:
docker exec -i sofitul-db psql -U sofitul_admin -d sofitul_onetrade \
  < backend/migrations/001_schema_inicial.sql
```

### 6. Iniciar en modo desarrollo

```bash
# En dos terminales:
cd backend && pnpm run start:dev
cd frontend && pnpm run dev
```

- Backend: http://localhost:3002
- Frontend: http://localhost:5174

## Deploy a producción

```bash
# Asegurarse de tener todo commiteado
git add . && git commit -m "descripción"

# Deployar
bash deploy.sh
```

## Variables de entorno de producción

Copiar `backend/.env.production` y completar:
- `SMTP_USER` y `SMTP_PASS` con las credenciales de correo
- `JWT_SECRET` con un valor seguro generado

## Accesos en producción

- Frontend: https://sofitul.onetradesa.pro
- PM2 logs: `ssh -i ~/.ssh/gestides_key root@172.235.128.206 'pm2 logs sofitul-backend'`
- DB: PostgreSQL en Docker, base `sofitul_onetrade`, usuario `sofitul_admin`
