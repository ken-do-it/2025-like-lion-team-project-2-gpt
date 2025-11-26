# Start Tomorrow Notes

## What was done
- Added Alembic scaffolding and initial migration (e009eed99dea_init_schema.py) with core models: UserProfile, Track, Tag/TrackTag, Playlist/PlaylistTrack, Like, Comment, Follow, PlayHistory.
- Configured Alembic env to load settings from app.core.config and Base metadata; default DB URL set to SQLite (sqlite:///./app.db).
- Added track API stubs (/api/tracks list/create/get) using simple schemas; owner is hardcoded to 1 for now.
- Updated FastAPI dev server port to 8001 in main.py.
- Created skill_back_music_summary.md with high-level requirements/phases from the skill doc.
- Added an auth stub dependency (X-User-Id header) and wired track create to use the current user; basic schema validation for track titles/fields.
- Added upload session model + migration (f14b4bf1c5d0_add_upload_session.py) and upload initiate/finalize endpoints (placeholder presigned URL). Finalize creates a Track with status=processing and audio_url set to storage_key.
- Added global error handler returning `{code, message}` JSON (VALIDATION_FAILED, TRACK_NOT_FOUND, UPLOAD_NOT_FOUND, etc.).
- Added JWT verification helper using JWKS (RS256) with fallback to X-User-Id; `get_current_user` now decodes Bearer tokens (errors: INVALID_TOKEN, INVALID_SUB, etc.).
- Added storage presign stub service and upload session expiry checks; initiate now returns presigned stub URL, finalize rejects expired/invalid sessions.
- Added README note about SQLite→PostgreSQL switch and created `team_2_music_back/.env.example` with DB/S3 placeholders.
- Added auth settings: JWKS audience + allow_header_auth flag; README section on JWT setup.
- Added service layer for tracks/uploads (`app/services/tracks.py`) and in-memory pytest skeleton; README updated with test command.
- Added local direct upload endpoint (`POST /api/tracks/upload/direct` with multipart file) storing under local storage path; config includes `MUSIC_LOCAL_STORAGE_PATH` (default `storage`).

## How to run locally
- cd team_2_music_back
- alembic upgrade head  # creates SQLite app.db (or set MUSIC_DATABASE_URL for another DB)
- uvicorn main:app --reload --port 8001
- Health check: GET http://127.0.0.1:8001/api/health
- Swagger: GET http://127.0.0.1:8001/docs
- Env template: `team_2_music_back/.env.example` (copy to `.env` and fill)
- Auth: prefer `Authorization: Bearer <jwt>` (RS256, JWKS); dev fallback `X-User-Id` works only if `MUSIC_ALLOW_HEADER_AUTH=true`.
- Tests: `cd team_2_music_back && python -m pytest -q`
- Env template: `team_2_music_back/.env.example` (copy to `.env` and fill)

## Next steps (suggested)
- Wire auth: inject current user from JWT instead of X-User-Id stub.
- Replace placeholder presign URL with real S3 presign; add audio/cover URL handling and cleanup of expired upload sessions.
- Flesh out schemas/validation and error responses (TRACK_NOT_FOUND, UPLOAD_NOT_FOUND, etc.).
- Add service layer/tests and README instructions for migrations and env variables.
- Prepare DB switch to PostgreSQL by updating MUSIC_DATABASE_URL when ready.
