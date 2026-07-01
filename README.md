# 🥋 프롬프트 도장

서비스기획팀을 위한 **매일 프롬프트 훈련** 웹앱입니다.

## 기능

- **오늘의 미션** — 7가지 PM 프롬프트 유형이 매일 로테이션
- **RCTO 분석** — Role, Context, Task, Output 4요소 자동 체크
- **점수 & 피드백** — 프롬프트 품질 점수와 개선 제안
- **Before/After** — 내 프롬프트 vs 개선 방향 비교
- **모범 답안** — RCTO가 적용된 마스터 프롬프트 제공
- **연속 훈련 기록** — 스트릭, 히스토리 (브라우저 localStorage)

## 로컬에서 실행

```bash
# 방법 1: Python 내장 서버
cd prompt-dojo
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속

# 방법 2: VS Code / Cursor Live Server 확장 사용
# index.html 우클릭 → "Open with Live Server"
```

> Node.js 설치 없이 바로 실행 가능한 정적 웹앱입니다.

## Vercel 배포 (추천)

### 1단계: GitHub에 올리기

```bash
cd prompt-dojo
git add .
git commit -m "프롬프트 도장 v1.0 — 서비스기획팀 프롬프트 훈련 앱"
```

GitHub에서 새 저장소(repository)를 만든 후:

```bash
git remote add origin https://github.com/내아이디/prompt-dojo.git
git branch -M main
git push -u origin main
```

### 2단계: Vercel 연결

1. [vercel.com](https://vercel.com) 가입 (GitHub 계정으로 로그인)
2. **Add New Project** 클릭
3. GitHub 저장소 `prompt-dojo` 선택
4. Framework Preset: **Other** (정적 사이트)
5. **Deploy** 클릭

몇 분 후 `https://prompt-dojo.vercel.app` 같은 URL이 생성됩니다.

### 3단계: 팀에 공유

생성된 URL을 서비스기획팀 채널에 공유하면 끝!

## Netlify 배포 (대안)

1. [netlify.com](https://netlify.com) 가입
2. **Add new site → Import an existing project**
3. GitHub 저장소 연결
4. Build command: (비워두기)
5. Publish directory: `/` (루트)
6. **Deploy**

## 도메인 연결 (선택)

Vercel 프로젝트 → Settings → Domains에서 커스텀 도메인 추가 가능.
예: `prompt.우리회사.com`

## 기술 스택

- HTML / CSS / JavaScript (바닐라)
- localStorage (데이터 저장)
- 빌드 도구 불필요

## 라이선스

MIT
