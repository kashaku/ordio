# Agent Skills

This directory stores external skill references for this project. They are not runtime code and are not installed into the global Codex skills directory.

## Source

- Repository: https://github.com/anthropics/skills
- Download date: 2026-10-08
- Local path: `agent-skills/anthropics/`

## Included Skills

- `frontend-design`: visual design guidance for distinctive, intentional UI work.
- `webapp-testing`: Playwright-based testing guidance for local web applications.
- `web-artifacts-builder`: reference material for React, TypeScript, Vite, Tailwind CSS, and shadcn/ui style artifact structure.

## How To Use In This Project

1. Before implementing the merchant and customer pages, read `anthropics/frontend-design/SKILL.md`.
2. Use `docs/design-system.md` as the project-specific UI direction for the ordering demo.
3. After implementing pages, use the `webapp-testing` guidance for browser checks, screenshots, and interaction verification.
4. Treat `web-artifacts-builder` as a structural reference only. This project should remain a normal Vite web app, not a single-file Claude artifact bundle.

## Licensing

Upstream license and third-party notices are preserved under `agent-skills/anthropics/`.
