# Only One Playlist Event Page

직원 참여형 추천곡 이벤트를 위한 풀스택 웹앱입니다.

## 포함 기능

- 추천곡 등록 폼
  - 이름
  - 소속회사
  - 부서명
  - 추천하는 곡명
  - 가수 이름
  - 추천 이유
- **1인 1곡 등록 제한**
- 상단 **하이라이트 스포트라이트 영역**
- 하단 **전체 추천곡 카드 리스트**
- **12개씩 페이지네이션**
- 다른 직원들이 좋아요 누르기
- 카드 / 팝업에서 **유튜브 검색으로 바로 듣기**
- 검색 / 정렬
- SQLite 기반 저장
- **관리자 페이지에서 CSV / Excel 일괄 다운로드**
- Docker 배포 가능

## 사용자 화면 구조

- 메인 히어로 랜딩
- 추천곡 등록 **모달**
- 하이라이트 카드 영역
- 전체 추천곡 리스트
- 카드 클릭 시 상세 팝업

즉, 첫 화면에 STEP 1 / STEP 2 안내를 길게 노출하지 않고,
이벤트 랜딩 → 하이라이트 → 전체 리스트 구조로 정리되어 있습니다.

## 기술 스택

- FastAPI
- Jinja2 템플릿
- Vanilla JavaScript
- SQLite
- OpenPyXL
- Docker

## 로컬 실행

```bash
cd playlist-event
python -m venv .venv
source .venv/bin/activate   # Windows는 .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

브라우저에서 `http://localhost:8000` 접속

## 데이터 파일 위치

기본 DB 파일:

```bash
./data/playlist_event.db
```

원하면 환경변수로 변경할 수 있습니다.

```bash
DB_PATH=/absolute/path/playlist_event.db uvicorn app.main:app --reload
```

## 관리자 페이지

관리자 화면:

```bash
http://localhost:8000/admin
```

기본 관리자 비밀번호는 아래 값입니다.

```bash
change-me-admin
```

실제 배포 전에는 반드시 환경변수로 변경하세요.

```bash
ADMIN_PASSWORD="your-secure-password" uvicorn app.main:app --reload
```

추가로 쿠키 서명을 위한 시크릿도 같이 설정하는 것을 권장합니다.

```bash
ADMIN_PASSWORD="your-secure-password" \
SECRET_KEY="your-long-random-secret" \
uvicorn app.main:app --reload
```

### 다운로드되는 항목

- ID
- 이름
- 소속회사
- 부서명
- 추천곡명
- 가수명
- 추천 이유
- 좋아요 수
- 등록일시(KST)
- 유튜브 검색 링크

## Docker 실행

```bash
docker build -t playlist-event .
docker run -p 8000:8000 \
  -e ADMIN_PASSWORD='your-secure-password' \
  -e SECRET_KEY='your-long-random-secret' \
  -v $(pwd)/data:/data \
  playlist-event
```

## 서버 배포 팁

이 프로젝트는 Docker 기반으로 바로 서버에 올릴 수 있게 구성되어 있습니다.

### 방법 1) 사내 서버 / VPS

```bash
git clone <repo>
cd playlist-event
docker build -t playlist-event .
docker run -d --name playlist-event \
  -p 80:8000 \
  -e ADMIN_PASSWORD='your-secure-password' \
  -e SECRET_KEY='your-long-random-secret' \
  -v /srv/playlist-event-data:/data \
  playlist-event
```

### 방법 2) Render / Railway 같은 Docker 지원 서비스

- 저장소에 이 프로젝트를 업로드
- Docker 배포 선택
- 영구 스토리지 또는 디스크 마운트 연결
- 포트 8000 사용
- `DB_PATH=/data/playlist_event.db` 유지
- 환경변수 `ADMIN_PASSWORD`, `SECRET_KEY` 추가

## 운영 시 권장 사항

- 실제 사내 이벤트 운영이면 SQLite로도 충분한 경우가 많습니다.
- 참여 인원이 많아지고 동시 접속이 커지면 PostgreSQL로 전환하는 것이 좋습니다.
- 좋아요는 브라우저 기준 1회 제한입니다.
- 관리자 페이지는 반드시 비밀번호를 변경한 뒤 공개 환경에 배포하세요.

## 주요 API

### 전체 목록 조회

```http
GET /api/entries
```

### 추천곡 등록

```http
POST /api/entries
Content-Type: application/json

{
  "name": "김하늘",
  "company": "Only One",
  "department": "브랜드커뮤니케이션팀",
  "songTitle": "Sunday",
  "artistName": "JAY PARK",
  "reason": "출근길에 들으면 기분이 좋아지고 팀원들과 공유하고 싶은 곡입니다."
}
```

### 좋아요

```http
POST /api/entries/{id}/like
Content-Type: application/json

{
  "clientToken": "browser-unique-token"
}
```

## 커스터마이징 포인트

- `app/templates/index.html` : 랜딩/섹션 구조 수정
- `app/templates/admin.html` : 관리자 화면 수정
- `app/static/styles.css` : 컬러, 카드 스타일, 모달 스타일 수정
- `app/static/app.js` : 하이라이트/페이지네이션/상세 팝업 인터랙션 수정
- `app/main.py` : API, DB 구조 확장
