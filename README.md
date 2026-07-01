# 🏠 서비스기획팀 허브

팀원을 위한 **프롬프트 훈련** + **보안·IT 뉴스** 통합 플랫폼입니다.

## 서비스 구성

| 서비스 | 경로 | 설명 |
|--------|------|------|
| **허브 (메인)** | `/` | 여러 서비스로 이동하는 메인 페이지 |
| **프롬프트 도장** | `/prompt/` | 매일 RCTO 프롬프트 훈련 |
| **매일 뉴스** | `/news/` | 보안·IT 뉴스 카테고리별 요약 |
| **뉴스 API** | `/api/news` | RSS 기반 뉴스 수집 (Vercel 서버리스) |

## 뉴스 업데이트 방식

- **매일 자동 갱신**: Vercel 서버리스 API가 RSS 피드에서 최신 기사를 수집
- **캐시**: 1시간마다 새로고침 (트래픽 절약)
- **카테고리**: 보안 사고, 정책·규제, AI·기술, 클라우드·인프라, 국내 이슈
- **출처**: The Hacker News, BleepingComputer, Krebs, Ars Technica, 보안뉴스, 전자신문

## 로컬 실행

```bash
# 정적 파일만 (허브, 프롬프트 — 뉴스 API 제외)
python3 -m http.server 8080

# 뉴스 API 포함 (Vercel CLI 필요)
npm install
npx vercel dev
```

## 배포 (Vercel)

```bash
git add .
git commit -m "팀 허브 v2.0 — 메인 페이지 + 뉴스 서비스"
git push
```

Vercel이 자동으로 재배포합니다. `package.json`의 `rss-parser`가 서버에서 설치됩니다.

## 기술 스택

- **프론트**: HTML / CSS / JavaScript (반응형)
- **뉴스 수집**: Vercel Serverless Function + RSS
- **프롬프트 훈련 데이터**: 브라우저 localStorage
- **배포**: Vercel + GitHub

## 팀원

성욱 · 병조 · 경하 · 유리 · 다해
