# undercov.kr 작업 인수인계

## 프로젝트 개요
- 사업자번호 인증 기반 점주 익명 커뮤니티 + 매출 벤치마킹 플랫폼
- 스택: 바닐라 HTML/CSS/JS + Supabase + Cloudflare Pages
- 도메인: undercov.kr
- 빌드: build-seo.js로 브랜드 상세 페이지 112개 정적 생성 (SSG)

## 큰 그림 — 진행 중인 작업
사용자 의도: SEO 최적화를 위해 URL 구조를 변경하고, 인증 구조를 개편한다.

### 인증 구조 (목표)
| 영역 | 읽기 | 쓰기 |
|---|---|---|
| 언더커버 > 자유게시판 | 누구나 | 회원가입 |
| 언더커버 > 사건사고 | 누구나 | 회원가입 |
| 언더커버 > 언더커버(브랜드) | 사업자인증 | 사업자인증 |
| 매출기록 | 사업자인증 | 사업자인증 |
| 분석 | 사업자인증 | 사업자인증 |

현재는 회원가입=사업자인증으로 묶여있음. 일반 회원가입을 분리해야 함.

### URL 구조 (목표)
- 현재: 해시 라우팅 (https://undercov.kr/#post-detail) → SEO 불가
- 목표: path 라우팅 + Cloudflare Pages Functions SSR
- 형식 예시: /community/free/제목-abc12345

## 단계별 로드맵

### Phase 1: URL 구조 (SEO) — 진행 중
1. posts 테이블에 slug 컬럼 추가 ← **다음에 할 작업**
2. 해시 라우팅 → path 라우팅 전환
3. Cloudflare Pages Functions로 글 상세 SSR
4. 동적 메타 태그 (title/og:* 글 내용 기반)
5. sitemap.xml에 게시글 URL 자동 포함

### Phase 2: 인증 구조 — 보류
1. profiles에 사용자 등급 컬럼 (general / verified)
2. 일반 회원가입 플로우 분리
3. 권한 체크 로직 세분화

## 완료된 작업

### DB 클린업 (완료)
원래는 9,918개 더미 글에 slug 백필을 하려 했으나, 사용자 판단으로 더미 데이터 전체 삭제하고 클린 상태로 전환.

삭제 결과:
- post_comments: 59,402 → 0
- posts: 9,918 → 0
- post_likes: 0 → 0
- profiles: 3,785 → 1 (admin: zzabhm@gmail.com만 보존)
- auth.users: 5 → 1 (admin만 보존)
- store_data: 2 → 2 (admin 소유, 보존)
- brands: 125 → 125 (보존)

백업: backups/pre-cleanup-2026-05-04T11-54-03.sql

### 환경
- .env 파일 재생성 완료 (이전에 git 복구 과정에서 삭제됐었음)
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SITE_URL 설정됨

### 트러블슈팅 메모
- Supabase auth.users API에서 x-total-count 헤더가 잘못된 값(3,784) 반환했었음. 실제는 5명이었음. Supabase 측 카운트 캐시 버그로 추정. 직접 GET /auth/v1/admin/users/{id}로 확인하면 정확한 결과 나옴.

## 다음에 시작할 작업: Phase 1 - 1단계 (수정 버전)

posts 테이블에 slug 컬럼을 처음부터 NOT NULL로 추가.
DB가 비어있어서 백필 불필요. 컬럼 추가만 하면 됨.

작업 내용:
1. 마이그레이션 SQL 작성/실행
   - slug TEXT NOT NULL 컬럼 추가
   - (board, slug) UNIQUE 인덱스 (CREATE INDEX CONCURRENTLY)
   - slug 단독 검색 인덱스 (CREATE INDEX CONCURRENTLY)

2. js/utils/slug.js 유틸 작성
   - generateSlug(title, postId) 함수
   - 형식: {슬러그화 제목}-{UUID 앞 8자리}
   - 한글 보존, 공백→하이픈, 특수문자 제거, 최대 80자
   - 빈 제목이면 "post-{UUID 8자리}" fallback

3. 글쓰기 로직에 slug 자동 생성 통합
   - community.js의 INSERT 부분에서 title → slug 자동 생성 후 함께 저장

4. 검증
   - 컬럼/인덱스 생성 확인
   - 테스트 INSERT 후 즉시 정리

## 작업 원칙 (사용자 지시)
- 한 단계씩 진행. 사용자 승인 없이 다음 단계로 넘어가지 말 것
- 코드 변경 전 항상 현재 구조 먼저 파악 (추측 금지)
- store_data, brands, profiles, auth.users는 별도 지시 없으면 건드리지 말 것
- 프론트엔드 코드(js/, *.html)는 명시적 지시가 있을 때만 수정
