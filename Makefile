.PHONY: up down build logs migrate seed up-prod build-prod

up:
	docker compose up -d

up-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

down:
	docker compose down

build:
	docker compose build

build-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

logs:
	docker compose logs -f

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python -m scripts.seed

shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U medha -d medha

restart-backend:
	docker compose restart backend celery

restart-baileys:
	docker compose restart baileys-service
