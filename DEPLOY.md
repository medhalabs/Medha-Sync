# Deploy Medha-Sync to a DigitalOcean Droplet

Guide for pushing code from GitHub to a VPS and running the production stack.

## Architecture

| Where | What runs |
|-------|-----------|
| **Droplet** | Backend API, Postgres, Redis, MinIO, Celery, Baileys |
| **Vercel** (recommended) | Next.js frontend |
| **DNS** | `api.yourdomain.com` → droplet, `app.yourdomain.com` → Vercel |

You can also run the frontend on the droplet — see [Frontend options](#frontend-options).

---

## Prerequisites

- DigitalOcean droplet (Ubuntu 24.04, **2 GB+ RAM** recommended)
- SSH access to the droplet
- Code pushed to GitHub (e.g. `https://github.com/medhalabs/Medha-Sync`)
- Domain pointed at the droplet (optional but recommended for HTTPS)

---

## First-time setup

### 1. SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Install Docker and Git

```bash
apt update && apt upgrade -y
apt install -y git make

curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Verify Compose (many droplets use the hyphenated command):

```bash
docker-compose version
```

> **Note:** If `docker compose` (with a space) fails but `docker-compose` works, use the hyphenated form in all commands below. The Makefile uses `docker compose` and will fail on older droplets — use the commands in this doc instead.

### 3. Clone the repo

```bash
mkdir -p ~/www
cd ~/www
git clone https://github.com/medhalabs/Medha-Sync.git
cd Medha-Sync
```

### 4. Configure production `.env`

```bash
cp .env.example .env
nano .env
```

Set at minimum:

```env
ENVIRONMENT=production
DEBUG=false

# Strong secrets — generate with: openssl rand -hex 32
SECRET_KEY=your-long-random-secret
NEXTAUTH_SECRET=your-long-random-secret
POSTGRES_PASSWORD=strong-db-password

# Docker network hostnames (do NOT use localhost on the droplet)
DATABASE_URL=postgresql+asyncpg://medha:YOUR_DB_PASSWORD@postgres:5432/medha
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=minio:9000
BACKEND_URL=http://backend:8000
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
BAILEYS_SERVICE_URL=http://baileys-service:3001

# Public URLs
PUBLIC_API_URL=https://api.yourdomain.com
CORS_ORIGINS=["https://app.yourdomain.com"]

# OAuth callbacks (match your frontend URL)
GOOGLE_REDIRECT_URI=https://app.yourdomain.com/settings/email-callback
GOOGLE_AUTH_REDIRECT_URI=https://app.yourdomain.com/auth/google/callback
MICROSOFT_REDIRECT_URI=https://app.yourdomain.com/settings/email-callback

WA_PROVIDER=baileys
```

Never commit `.env` to git. Keep production secrets only on the server.

### 5. Build and start

```bash
cd ~/www/Medha-Sync

docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker-compose exec -T backend alembic upgrade head
```

Verify:

```bash
docker-compose ps
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

---

## HTTPS with nginx (API)

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/medha-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 15M;
    }
}
```

Enable and get SSL:

```bash
ln -s /etc/nginx/sites-available/medha-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.yourdomain.com
```

Point DNS: **`api.yourdomain.com` → droplet IP** (A record).

Firewall:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## Frontend options

### Option A — Vercel (recommended)

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Environment variables:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `NEXTAUTH_URL` | `https://app.yourdomain.com` |
| `NEXTAUTH_SECRET` | same as droplet `.env` |

4. Point **`app.yourdomain.com`** to Vercel

### Option B — Docker frontend on the droplet

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile with-frontend up -d --build
```

Proxy port `3000` through nginx (similar to the API block above).

---

## Deploy updates (after `git push`)

On your Mac, push to GitHub:

```bash
git push origin main
```

On the droplet, run the full update script:

```bash
cd ~/www/Medha-Sync

# 1. Preserve production secrets
cp .env /tmp/medha.env.backup

# 2. Sync with GitHub (discard local code changes)
git fetch origin
git reset --hard origin/main
git clean -fd

# 3. Restore production .env
cp /tmp/medha.env.backup .env

# 4. Rebuild and restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker-compose exec -T backend alembic upgrade head

# 5. Verify
curl http://localhost:8000/health
docker-compose ps
```

One-liner (after SSH in):

```bash
cd ~/www/Medha-Sync && cp .env /tmp/medha.env.backup && git fetch origin && git reset --hard origin/main && git clean -fd && cp /tmp/medha.env.backup .env && docker-compose -f docker-compose.yml -f docker-compose.prod.yml build && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d && docker-compose exec -T backend alembic upgrade head
```

---

## Fix `git pull` conflicts on the droplet

If `git pull` fails with errors like:

```
error: Your local changes to the following files would be overwritten by merge:
        .env
        backend/__pycache__/...
Please commit your changes or stash them before you merge.
```

**Do not use `git pull` on the server.** The droplet should track GitHub, not hold its own commits.

Use the [deploy updates](#deploy-updates-after-git-push) flow instead:

1. Back up `.env`
2. `git reset --hard origin/main`
3. `git clean -fd`
4. Restore `.env`
5. Rebuild containers

Common causes of this error:

- `.env` was edited on the server (expected — always back it up first)
- `__pycache__` or `celerybeat-schedule` were accidentally committed or modified
- Old untracked files conflict with files now in the repo

---

## Useful commands on the droplet

```bash
cd ~/www/Medha-Sync

docker-compose ps                          # service status
docker-compose logs -f backend             # API logs
docker-compose logs -f celery              # email sync worker
docker-compose restart backend celery      # restart API + worker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down   # stop all
curl http://localhost:8000/health          # health check
```

---

## Troubleshooting

### `make build-prod` fails with `unknown shorthand flag: 'f' in -f'`

The droplet has `docker-compose` (v1), not the `docker compose` plugin. Use the full `docker-compose -f ...` commands from this doc.

### `KeyError: 'ContainerConfig'` during `docker-compose up`

Old docker-compose + newer Docker engine. Fix:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### CORS errors (Vercel frontend + droplet API)

On the droplet `.env`:

```env
CORS_ORIGINS=["https://your-app.vercel.app"]
PUBLIC_API_URL=https://api.yourdomain.com
```

Restart backend after changing `.env`:

```bash
docker-compose restart backend
```

### OAuth redirect errors

Google Cloud Console and Azure App Registration redirect URIs must exactly match:

- `https://app.yourdomain.com/settings/email-callback`
- `https://app.yourdomain.com/auth/google/callback`

---

## Pre-launch checklist

- [ ] Strong `SECRET_KEY`, `NEXTAUTH_SECRET`, `POSTGRES_PASSWORD`
- [ ] `PUBLIC_API_URL` and `CORS_ORIGINS` match real URLs
- [ ] OAuth redirect URIs updated in Google / Microsoft consoles
- [ ] DNS A records for API (and app if using custom domain)
- [ ] HTTPS enabled (nginx + certbot)
- [ ] Migrations run (`docker-compose exec -T backend alembic upgrade head`)
- [ ] `curl http://localhost:8000/health` returns `{"status":"ok"}`
