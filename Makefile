# Makefile — G_Notebook (NOs - Notion Operating System)
# TypeScript build targets for development workflow

.PHONY: help install build lint type-check test dev clean validate backup deploy sync-canvas

# Default target
help: ## Show this help message
	@echo ""
	@echo "G_Notebook — NOs (Notion Operating System)"
	@echo "============================================"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  %-16s %s\n", $$1, $$2}'
	@echo ""

# ── Setup ──────────────────────────────────────────────

install: ## Install npm dependencies
	npm install

# ── Build ──────────────────────────────────────────────

build: ## Compile TypeScript to dist/
	npm run build

dev: ## Start dev server with tsx watch
	npm run dev

# ── Quality ────────────────────────────────────────────

lint: ## Run ESLint on src/
	npm run lint

type-check: ## Run TypeScript type checking (no emit)
	npm run type-check

test: ## Run Vitest test suite
	npm run test

# ── Validation & Operations ────────────────────────────

validate: ## Validate nos.yaml manifest against config
	npm run validate:manifest

backup: ## Backup all Notion databases to JSON (requires NOTION_TOKEN)
	npm run backup:notion

deploy: ## Deploy schema to Notion (requires --notion-token)
	npm run deploy

sync-canvas: ## Sync Canvas LMS data to Notion
	npm run sync:canvas

# ── Cleanup ────────────────────────────────────────────

clean: ## Remove compiled output and caches
	rm -rf dist/
	rm -rf node_modules/.cache
	@echo "Cleaned dist/ and caches."
