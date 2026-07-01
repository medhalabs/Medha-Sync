# Medha Platform

Unified WhatsApp automation + Email sync + CRM.

## Stack


| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend          | Python 3.12, FastAPI, uv            |
| WhatsApp (dev)   | Baileys (Node.js sidecar)           |
| WhatsApp (prod)  | Meta Cloud API                      |
| Email            | IMAP/SMTP                           |
| Database         | PostgreSQL 16                       |
| Cache / Sessions | Redis 7                             |
| File storage     | MinIO                               |
| Workers          | Celery + Redis                      |
| Containers       | Docker + Docker Compose             |


## Quick start

```bash
cp .env.example .env
# edit .env with your values
make build
make up
make migrate
```

**Production (droplet API + [https://www.medhasync.in](https://www.medhasync.in)):**

See **[DEPLOY.md](./DEPLOY.md)** for full droplet setup, HTTPS, and update commands.

```bash
make build-prod
make up-prod
make migrate
```

> On some droplets only `docker-compose` (hyphenated) is installed — use the commands in [DEPLOY.md](./DEPLOY.md) instead of `make`.

Set frontend environment variables (hosting provider for www.medhasync.in):

| Variable | Value |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://YOUR_DROPLET_IP:8000` |
| `NEXTAUTH_URL` | `https://www.medhasync.in` |
| `NEXTAUTH_SECRET` | same as droplet `.env` |
| `BACKEND_URL` | `http://YOUR_DROPLET_IP:8000` |

On the droplet `.env`, set `CORS_ORIGINS` to include `https://www.medhasync.in` and `PUBLIC_API_URL` to your droplet API URL.

Open [http://localhost:3000](http://localhost:3000) (local dev only)

## Services


| Service         | URL                                                      |
| --------------- | -------------------------------------------------------- |
| Frontend        | [http://localhost:3000](http://localhost:3000)           |
| Backend API     | [http://localhost:8000](http://localhost:8000)           |
| API docs        | [http://localhost:8000/docs](http://localhost:8000/docs) |
| MinIO console   | [http://localhost:9001](http://localhost:9001)           |
| Baileys service | [http://localhost:3001](http://localhost:3001)           |


## WhatsApp setup

**Dev (Baileys):** Set `WA_PROVIDER=baileys` in `.env`. Open [http://localhost:3001/qr](http://localhost:3001/qr) to scan QR code.

**Production (Meta):** Set `WA_PROVIDER=meta` and fill `META_`* vars in `.env`.

## Project structure

```
├── backend/          Python FastAPI — features as individual modules
├── frontend/         Next.js — features as individual folders
├── baileys-service/  Node.js WhatsApp sidecar
├── docker-compose.yml
└── .env.example
```

