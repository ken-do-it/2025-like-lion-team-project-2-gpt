# PostgreSQL 연결 오류 정리 (EC2 / Docker Compose)

## 발생했던 오류
1. **`ModuleNotFoundError: No module named 'psycopg2'`**  
   - DB URL이 `postgres://...`로 되어 있어 psycopg2를 찾으려다 실패.
2. **`password authentication failed for user ...`**  
   - DB에 해당 사용자/비밀번호가 실제로 없거나, 다른 컨테이너/인스턴스에 접속.
3. **`role "postgres" does not exist`** / `WARN: POSTGRES_* is not set`  
   - Compose가 `POSTGRES_*` 값을 못 받아 DB가 기본 사용자 없이 올라감.
4. **Mixed port/host**  
   - 백엔드는 `db:5432`, 외부 접속은 `호스트IP:65432`를 써야 하는데 혼동.

## 원인
- DB URL과 드라이버 불일치 (`postgres://` vs `postgresql+psycopg://`).
- `.env` 값이 루트/컨테이너에 제대로 주입되지 않음.
- DB 사용자/DB명이 실제로 생성되지 않았거나 비밀번호 불일치.
- 포트/호스트 혼동(내부 컨테이너용 주소와 외부 DBeaver용 주소를 혼용).

## 해결 방법
1. **DB URL 통일 (psycopg3)**  
   ```env
   MUSIC_DATABASE_URL=postgresql+psycopg://kevin_music:Qwer1973!@db:5432/kevin_music_db
   ```
   - 백엔드 컨테이너는 `db:5432`로 접속.
   - DBeaver 등 외부 접속은 `호스트IP:65432` 사용.

2. **루트 `.env` 설정 (Compose가 참조)**  
   ```
   POSTGRES_USER=kevin_music
   POSTGRES_PASSWORD=Qwer1973!
   POSTGRES_DB=kevin_music_db
   MUSIC_DATABASE_URL=postgresql+psycopg://kevin_music:Qwer1973!@db:5432/kevin_music_db
   ```

3. **DB 초기화/재기동**  
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

4. **계정/비밀번호 확인 또는 재설정** (컨테이너 안에서)  
   ```bash
   docker compose exec db psql -U kevin_music -d kevin_music_db
   -- 없으면 생성:
   -- CREATE USER kevin_music WITH PASSWORD 'Qwer1973!';
   -- ALTER USER kevin_music WITH PASSWORD 'Qwer1973!';
   \q
   ```

5. **마이그레이션**  
   ```bash
   docker compose exec backend alembic upgrade head
   ```

## 정상 동작 확인 체크리스트
- `docker compose ps`에서 backend/db/nginx 모두 Up 상태.
- 컨테이너 내부 psql 접속: `docker compose exec db psql -U kevin_music -d kevin_music_db`.
- 백엔드 헬스체크: `http://<호스트IP>:8001/api/health` (또는 nginx 프록시 뒤 도메인).
- DBeaver 외부 접속: Host=<호스트IP>, Port=65432, DB=kevin_music_db, User/Pass=kevin_music / Qwer1973!.
