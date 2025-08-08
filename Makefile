SHELL := /bin/bash

# Defaults (override with: make serve PORT=9000, make push MSG="feat: add X")
PORT ?= 8000
MSG ?= autocommit: update
BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo master)

.PHONY: help serve open push gp status

help:
	@echo "Available targets:"
	@echo "  make serve        # Start local static server on PORT (default: 8000)"
	@echo "  make open         # Open the game in default browser (macOS 'open')"
	@echo "  make push MSG=... # git add ., commit with MSG and push to BRANCH" \
		" (defaults: MSG='autocommit: update')"
	@echo "  make gp MSG=...   # Alias for push"
	@echo "  make status       # Show git status concise"
	@echo "Variables: PORT, MSG, BRANCH"

serve:
	@echo "Serving on http://localhost:$(PORT) (Ctrl+C to stop)"
	python3 -m http.server $(PORT)

open:
	@echo "Opening http://localhost:$(PORT)"
	open "http://localhost:$(PORT)" || true

push:
	@echo "Branch: $(BRANCH)"
	@git add .
	@if git diff --cached --quiet; then \
	  echo "No staged changes to commit."; \
	else \
	  echo "Committing: $(MSG)"; \
	  git commit -m "$(MSG)"; \
	fi
	@git push origin $(BRANCH)

gp: push

status:
	@git status -sb
