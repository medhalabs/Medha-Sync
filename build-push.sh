#!/usr/bin/env bash
#
# Build all app images for the droplet (linux/amd64) and push to a registry.
# Run this on your Mac. The droplet only pulls — it never builds.
#
# Usage:
#   REGISTRY=ghcr.io/youruser \
#   NEXT_PUBLIC_API_URL=https://api.your-domain.com \
#   ./build-push.sh [tag]
#
# Prereqs (one-time):
#   docker login ghcr.io            # or your registry
#   docker buildx create --use      # if you don't already have a builder
#
set -euo pipefail

REGISTRY="${REGISTRY:?Set REGISTRY, e.g. ghcr.io/youruser or registry.digitalocean.com/yourreg}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:?Set NEXT_PUBLIC_API_URL to the droplet's PUBLIC backend URL (baked into the frontend at build time)}"
TAG="${1:-latest}"
PLATFORM="linux/amd64"   # droplet is amd64; your Mac is arm64 — this is required

echo ">> backend  -> $REGISTRY/medha-backend:$TAG"
docker buildx build --platform "$PLATFORM" \
  -t "$REGISTRY/medha-backend:$TAG" --push ./backend

echo ">> baileys  -> $REGISTRY/medha-baileys:$TAG"
docker buildx build --platform "$PLATFORM" \
  -t "$REGISTRY/medha-baileys:$TAG" --push ./baileys-service

echo ">> frontend -> $REGISTRY/medha-frontend:$TAG"
docker buildx build --platform "$PLATFORM" \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  -t "$REGISTRY/medha-frontend:$TAG" --push ./frontend

cat <<EOF

Done. On the droplet:
  export REGISTRY=$REGISTRY TAG=$TAG
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
EOF
