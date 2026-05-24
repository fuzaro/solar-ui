# =============================================================================
# Solar UI — Build & Deploy
# =============================================================================

REGISTRY := localhost:5000
IMAGE    := $(REGISTRY)/solar-ui:1.0.0

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

.PHONY: dev
dev:
	npm run dev

.PHONY: typecheck
typecheck:
	npm run typecheck

.PHONY: install
install:
	npm install --legacy-peer-deps

# ---------------------------------------------------------------------------
# Container Build
# ---------------------------------------------------------------------------

.PHONY: build
build:
	@echo ">>> Building $(IMAGE)..."
	docker build -t $(IMAGE) .

.PHONY: push
push:
	@echo ">>> Pushing $(IMAGE) to local registry..."
	docker push $(IMAGE)

.PHONY: build-push
build-push: build push

# ---------------------------------------------------------------------------
# Nomad Deployment
# ---------------------------------------------------------------------------

.PHONY: deploy
deploy:
	@echo ">>> Deploying solar-ui to Nomad..."
	nomad job run deploy/solar-ui.nomad

.PHONY: stop
stop:
	@echo ">>> Stopping solar-ui..."
	nomad job stop solar-ui

.PHONY: status
status:
	nomad job status solar-ui

.PHONY: logs
logs:
	nomad alloc logs -job solar-ui

.PHONY: restart
restart: stop deploy
