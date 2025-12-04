# Upload 503/500 문제 정리

## 증상
- 프런트 업로드 시 503 `AUTH_NOT_CONFIGURED`, 이후 500 (FK 에러) 발생.
- 콘솔/CORS 메시지와 함께 업로드 실패.

## 원인
1. 인증 가드: `MUSIC_ALLOW_HEADER_AUTH`가 중복 선언 중 마지막에 `false`여서 헤더 인증이 차단됨.
2. 사용자 FK: `X-User-Id: 1`로 업로드 요청을 보내는데 `user_profiles` 테이블에 id=1 행이 없어 FK 제약 위반 발생.

## 조치
1) `.env` 정리  
- `MUSIC_ALLOW_HEADER_AUTH=true`로 고정(개발용).  
- DB URL에 DB 이름 포함: `MUSIC_DATABASE_URL=postgresql+psycopg://kevin_music:Qwer1973!@3.35.45.78:65432/kevin_music_db`  
- S3 비활성 시 `MUSIC_S3_BUCKET=` 등 빈 값, `MUSIC_LOCAL_STORAGE_PATH=storage` 유지.

2) 프런트 기본 헤더  
- `team_2_music_front/src/lib/api/client.ts`에서 `X-User-Id` 기본값을 1로 전송하도록 설정.

3) DB에 개발용 유저 생성  
```bash
docker compose exec db psql -U kevin_music -d kevin_music_db \
  -c "INSERT INTO user_profiles (id, auth_user_id, display_name, created_at, updated_at, is_active)
      VALUES (1, 'dev-user-1', 'Dev User', now(), now(), 1)
      ON CONFLICT (id) DO NOTHING;"
```

## 결과
- `AUTH_NOT_CONFIGURED` 503 해소.
- `owner_user_id` FK 에러 해소(업로드 정상 진행).
