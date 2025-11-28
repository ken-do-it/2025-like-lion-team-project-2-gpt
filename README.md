# 2025 Like Lion Team Project 2 — Music Sharing Platform

## 개요
- 목표: AI 음악을 업로드·탐색·공유할 수 있는 SNS형 음악 플랫폼.
- 참고 자료: `team_2_music_back/skill_back_music.md`(백엔드 아키텍처), `team_2_music_front/stitch_/...` HTML & PNG(프론트 레이아웃).
- 구성: FastAPI 기반 백엔드 + React/Vite/Tailwind 프론트 + PostgreSQL, Redis, S3, JWT(Auth Server) 통합.

## 프로젝트 구조
```
team_2_music_back/
  main.py                # FastAPI 엔트리포인트
  requirements.txt       # 백엔드 의존성
  app/
    api/                 # 라우터 + 의존성
    core/                # 설정, JWT 캐싱 등
    db/, models/, schemas/
team_2_music_front/
  package.json
  src/
    pages/               # 탐색/업로드/라이브러리/상세 페이지
    components/          # Nav, 카드, 업로드 폼 등
    data/                # 임시 Mock 데이터
```

## 개발 워크플로우
1. **백엔드**
   - `cd team_2_music_back`
   - `python -m venv .venv && .venv\Scripts\activate`
   - `pip install -r requirements.txt`
   - `.env` 작성 (PostgreSQL, Redis, S3, JWKS URL 등) 후 `uvicorn main:app --reload`
2. **프론트엔드**
   - `cd team_2_music_front`
   - `npm install`
   - `npm run dev` (http://localhost:5173)

## 다음 단계
- 백엔드: `skill_back_music.md`의 ERD·캐시·보안 지침을 코드(Alembic, 서비스 계층, JWT 미들웨어)로 구체화.
- 프론트: Stitch HTML을 기반으로 컴포넌트를 확장하고, API 연동/글로벌 플레이어/상태관리(TanStack Query 등)를 적용.
- 문서화: `AGENTS.md` 지침 유지, README에 API/테스트/배포 정보 지속 업데이트.

## Local DB now (SQLite) → PostgreSQL later
- Default DB: SQLite (sqlite:///./app.db) for local dev.
- Migrate schema: cd team_2_music_back && alembic upgrade head
- Run API: uvicorn main:app --reload --port 8001
- Switch to PostgreSQL when ready: set MUSIC_DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname then rerun lembic upgrade head.
- S3 presign is stubbed; replace in pp/core/storage.py with real S3 presign when migrating uploads to S3.

## Auth setup (JWT)
- Default: Bearer JWT via Authorization header (RS256) using MUSIC_JWKS_URL; audience optional (MUSIC_JWKS_AUDIENCE).
- Dev fallback: X-User-Id header works only when MUSIC_ALLOW_HEADER_AUTH is true (defaults to true). Disable in production.
- Missing JWKS and disabled fallback returns AUTH_NOT_CONFIGURED.
## Tests
- Backend tests (in-memory SQLite):
  - cd team_2_music_back && python -m pytest -q
- Service layer introduced for tracks/uploads: see pp/services/tracks.py; API routes delegate to services.
## File serving / uploads (local)
- Static mount: /uploads serves files from MUSIC_LOCAL_STORAGE_PATH (default storage).
- Direct upload endpoint: POST /api/tracks/upload/direct (multipart: file, title, optional description/cover_url).
- Validation: max size 50MB, allowed types: audio/mpeg, audio/mp3, audio/wav, audio/flac. Errors: FILE_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE.
