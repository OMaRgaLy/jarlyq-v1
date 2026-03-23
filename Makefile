.PHONY: up down logs build test lint up-local ssl-init

up:
	docker compose -f deploy/docker-compose.yml up -d --build

up-local:
	docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml up -d --build

down:
	docker compose -f deploy/docker-compose.yml down

logs:
	docker compose -f deploy/docker-compose.yml logs -f

build:
	cd backend && go build ./...
	cd frontend && npm install && npm run build

test:
	cd backend && go test ./...

ssl-init:
	docker compose -f deploy/docker-compose.yml run --rm certbot \
		certonly --webroot --webroot-path=/var/www/certbot \
		--email admin@$(DOMAIN) --agree-tos --no-eff-email \
		-d $(DOMAIN)
