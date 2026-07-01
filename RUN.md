# How to run Medha Sync

Guide for running the full stack or individual services — **locally** (on your machine) or with **Docker**.

---

## Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
| Docker + Compose | v2+ | Recommended local & production |
| Node.js | 20+ | Frontend, Baileys (local dev) |
| Python | 3.12+ | Backend (local dev) |
| [uv](https://docs.astral.sh/uv/) | latest | Python deps (local dev) |

---

## First-time setup

```bash
cd Medha-Sync
cp .env.example .env
```

Edit `.env` before starting. Values differ for **Docker** vs **local** — see [Environment notes](#environment-notes) below.

Run database migrations once the backend is up:

```bash
make migrate
# or locally:
cd backend && uv run alembic upgrade head
```

---

## Service overview

| Service | Port | Purpose |
|---------|------|---------|
| **frontend** | 3000 | Next.js dashboard |
| **backend** | 8000 | FastAPI REST API |
| **postgres** | 5456 → 5432 | Database |
| **redis** | 6379 | Cache, sessions, Celery broker |
| **minio** | 9000 (API), 9001 (console) | PDF/image storage |
| **celery** | — | Email sync (every 5 min) + broadcasts |
| **baileys-service** | 3001 | WhatsApp (dev QR mode) |

**URLs (local):**

- App: http://localhost:3000  
- API docs: http://localhost:8000/docs  
- WhatsApp QR: http://localhost:3001/qr  
- MinIO console: http://localhost:9001  

---

## Run all at once

### Docker (recommended)

Build and start every service in the background:

```bash
make build
make up
make migrate
```

Or without Make:

```bash
docker compose build
docker compose up -d
docker compose exec backend alembic upgrade head
```

Follow logs:

```bash
make logs
# or
docker compose logs -f
```

Stop everything:

```bash
make down
# or
docker compose down
```

**Production droplet (no frontend container — use Vercel for UI):**

See **[DEPLOY.md](./DEPLOY.md)** for the full guide (first-time setup, HTTPS, git pull fixes, `docker-compose` commands).

```bash
make build-prod
make up-prod
make migrate
```

On droplets where `make` fails, use `docker-compose` — details in [DEPLOY.md](./DEPLOY.md).

**Production with Docker frontend:**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile with-frontend up -d --build
```

---

### Local (hybrid — infra in Docker, apps on host)

Best for frontend/backend development with hot reload.

**Terminal 1 — infrastructure only:**

```bash
docker compose up -d postgres redis minio
```

**Terminal 2 — backend:**

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 — Celery (email sync + broadcasts):**

```bash
cd backend
uv run celery -A workers.celery_app worker --beat --loglevel=info --concurrency=1
```

**Terminal 4 — Baileys (WhatsApp dev):**

```bash
cd baileys-service
npm install
npm run dev
```

**Terminal 5 — frontend:**

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Use a **local `.env`** at the repo root (or export vars) with hostnames pointing to `localhost` — see [Environment notes](#environment-notes).

---

## Run services individually

### Docker — one service at a time

Start infrastructure first (backend depends on these):

```bash
docker compose up -d postgres redis minio
```

Then app services:

```bash
docker compose up -d backend
docker compose up -d celery
docker compose up -d baileys-service
docker compose up -d frontend
```

Run a single service in the **foreground** (see logs in terminal):

```bash
docker compose up backend
```

Rebuild one service after code changes:

```bash
docker compose build frontend
docker compose up -d frontend
```

Restart one service:

```bash
docker compose restart backend
docker compose restart celery
docker compose restart baileys-service
make restart-baileys   # shortcut for Baileys
```

Logs for one service:

```bash
docker compose logs -f backend
docker compose logs -f celery
docker compose logs -f baileys-service
docker compose logs -f frontend
```

Check status:

```bash
docker compose ps
```

---

### Local — one service at a time

Requires Postgres, Redis, and MinIO running (Docker or installed natively).

**Backend**

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

**Celery**

```bash
cd backend
uv run celery -A workers.celery_app worker --beat --loglevel=info --concurrency=1
```

**Baileys**

```bash
cd baileys-service
npm install
npm run dev          # with file watch
# or
npm start            # plain node
```

**Frontend**

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev          # dev server with hot reload
npm run build        # production build
npm start            # serve production build
```

**Postgres / Redis / MinIO (Docker, without other services)**

```bash
docker compose up -d postgres
docker compose up -d redis
docker compose up -d minio
```

---

## Environment notes

### Docker `.env` (default from `.env.example`)

Uses Docker network hostnames:

```env
DATABASE_URL=postgresql+asyncpg://medha:medha_secret@postgres:5432/medha
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=minio:9000
BAILEYS_SERVICE_URL=http://baileys-service:3001
BACKEND_URL=http://backend:8000
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:8000
```

### Local `.env` (apps on host, infra in Docker)

Override hostnames to `localhost`:

```env
DATABASE_URL=postgresql+asyncpg://medha:medha_secret@localhost:5456/medha
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=localhost:9000
BAILEYS_SERVICE_URL=http://localhost:3001
BACKEND_URL=http://localhost:8000
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:8000
```

Load env when running locally from repo root:

```bash
export $(grep -v '^#' .env | xargs)   # optional helper
```

---

## Useful commands

| Task | Command |
|------|---------|
| DB migrations | `make migrate` |
| Backend shell | `make shell-backend` |
| Postgres shell | `make shell-db` |
| Seed data | `make seed` |
| Rebuild all | `make build` |
| API health | `curl http://localhost:8000/health` |

---

## Troubleshooting

**`docker compose` vs `docker-compose`**

On some servers only the hyphenated form is installed:

```bash
docker-compose up -d --build
```

**Frontend build fails**

Run locally to see the error:

```bash
cd frontend && npm run build
```

**Backend can't connect to DB**

- Docker: ensure `DATABASE_URL` uses `@postgres:5432`
- Local: ensure Postgres is up and URL uses `@localhost:5456`

**WhatsApp not connecting**

1. `WA_PROVIDER=baileys` in `.env`
2. Baileys running: http://localhost:3001/qr
3. Scan QR with WhatsApp on your phone

**CORS errors (Vercel + droplet API)**

Set on the droplet:

```env
CORS_ORIGINS=["https://your-app.vercel.app"]
PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Quick reference

```
All at once (Docker):     make build && make up && make migrate
All at once (local):      docker compose up -d postgres redis minio
                          + backend, celery, baileys, frontend in separate terminals
Infra only:               docker compose up -d postgres redis minio
Single Docker service:    docker compose up -d <service-name>
Stop all:                 make down
Production (API only):    see DEPLOY.md (droplet) or make build-prod && make up-prod && make migrate
```
