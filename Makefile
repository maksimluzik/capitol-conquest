SHELL := /bin/bash

# Defaults (override with: make serve PORT=9000, make push MSG="feat: add X")
PORT ?= 8000
MSG ?= autocommit: update
BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo master)

.PHONY: help serve open push gp status tests

# Collect any extra words after 'push' or 'gp' as commit message override.
EXTRA_MSG_WORDS := $(filter-out push gp tests,$(MAKECMDGOALS))
EFFECTIVE_MSG := $(strip $(if $(EXTRA_MSG_WORDS),$(EXTRA_MSG_WORDS),$(MSG)))

# Declare extra words as phony no-op targets so make doesn't error.
.PHONY: $(EXTRA_MSG_WORDS)
$(EXTRA_MSG_WORDS):
	@:

help:
	@echo "Available targets:"
	@echo "  make serve        # Start local static server on PORT (default: 8000)"
	@echo "  make open         # Open the game in default browser (macOS 'open')"
	@echo "  make push MSG=...           # git add ., commit with MSG and push to BRANCH (default MSG)"
	@echo "  make push some words here   # trailing words become commit message (quotes optional)"
	@echo "  make status       # Show git status concise"
	@echo "  make tests        # Run unit tests"
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
	  echo "Committing: $(EFFECTIVE_MSG)"; \
	  git commit -m "$(EFFECTIVE_MSG)"; \
	fi
	@git push origin $(BRANCH)

gp: push

status:
	@git status -sb

tests:
	npm test
