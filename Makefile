.PHONY: up down logs build test lint

up:
	docker compose -f deploy/docker-compose.yml up -d --build

down:
	docker compose -f deploy/docker-compose.yml down

logs:
	docker compose -f deploy/docker-compose.yml logs -f

build:
	cd backend && go build ./...
	cd frontend && npm install && npm run build

test:
	cd backend && go test ./...

