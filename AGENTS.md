# Repository Guidelines

Use this guide to keep backend and frontend contributions consistent while the codebase is still being scaffolded.

## Project Structure & Module Organization
- `README.md` describes the high-level deliverable—update it whenever the contract or core flows change.
- `team_2_music_back/main.py` is the backend entry point. Keep reusable logic inside `team_2_music_back/app/` (create the package if missing) and configuration helpers inside `team_2_music_back/config/`.
- `team_2_music_front/` holds the client shell. Place React/Vite (or similar) source under `src/` and exclude build outputs (`dist/`, `.next/`, etc.) from Git.
- Store shared media or fixture files under `assets/` and reference them instead of duplicating data in each service.

## Build, Test, and Development Commands
- `cd team_2_music_back && python -m venv .venv && .venv\\Scripts\\activate` — create/activate a local virtual environment.
- `pip install -r requirements.txt` — install backend dependencies; keep this file under `team_2_music_back/` and update it with every new library.
- `python main.py` — run lightweight backend scripts or manual validations until a richer server (e.g., FastAPI + Uvicorn) is introduced.
- `cd team_2_music_front && npm install && npm run dev` — once the frontend scaffold exists, start the Vite dev server for rapid UI iteration.

## Coding Style & Naming Conventions
- Follow PEP 8 with 4-space indents, type hints, and module-level docstrings. Use `PascalCase` for classes, `snake_case` for Python modules/functions, and `PascalCase.jsx/tsx` for React components.
- Keep modules under ~200 lines, prefer pure functions, and inject dependencies so logic stays testable.
- Run `ruff` or `flake8` (team choice) before committing. Format JS/TS with `prettier --write team_2_music_front/src`.

## Testing Guidelines
- Use `pytest` for backend suites; mirror the app package under `team_2_music_back/tests/` with filenames like `test_playlist_service.py`.
- Name tests `test_<behavior>` and keep fixtures in `conftest.py`.
- Run `pytest -q` locally and aim for ≥85% coverage using `pytest --cov=app` before opening a PR.
- For the frontend, add Vitest specs under `team_2_music_front/src/__tests__/` once components land and run them via `npm test`.

## Commit & Pull Request Guidelines
- Write imperative, scoped commit subjects (e.g., `Add playlist filtering API`) and wrap description lines at 72 characters.
- Reference issues with `[#123]` and separate unrelated fixes into different commits.
- Pull requests must summarize motivation, list validation commands, and attach screenshots for UI-facing updates.
- Rebase on `main`, ensure CI is green, request at least one reviewer, and avoid force-pushing after approvals without notifying reviewers.

## Security & Configuration Tips
- Do not commit secrets. Load runtime configuration from `.env` files (ignored by Git) via `python-dotenv` or environment variables in production.
- Validate and sanitize all inbound data at the API layer, enforcing size/MIME checks for uploads and escaping user-generated content before rendering.
