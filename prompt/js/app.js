import { MISSIONS, getTodayMission, RCTO_GUIDE, TEAM_PARTS } from "./data.js";
import { analyzePrompt } from "./analyzer.js";
import {
  loadData,
  saveRecord,
  setUserName,
  getTodayRecord,
  getLast7Days,
  getTodayString,
} from "./storage.js";

let currentView = "dashboard";
let currentResult = null;

const mainContent = document.getElementById("mainContent");
const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

function render() {
  switch (currentView) {
    case "dashboard":
      renderDashboard();
      break;
    case "training":
      renderTraining();
      break;
    case "guide":
      renderGuide();
      break;
    case "history":
      renderHistory();
      break;
  }
}

function renderDashboard() {
  const data = loadData();
  const today = getTodayString();
  const todayRecord = getTodayRecord();
  const mission = getTodayMission();
  const last7 = getLast7Days();
  const avgScore = data.records.length
    ? Math.round(data.totalScore / data.records.length)
    : 0;

  mainContent.innerHTML = `
    <div class="welcome-banner">
      <h2>${data.userName ? `${data.userName}님, ` : ""}오늘도 프롬프트 수련! 🥋</h2>
      <p>매일 10분, RCTO 프레임워크로 프롬프트 실력을 키워보세요.</p>
    </div>

    ${!data.userName ? `
    <div class="card" style="margin-bottom:1.5rem">
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">팀원을 선택해 주세요</label>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          <select id="userNameSelect" class="form-select" style="flex:1;min-width:140px">
            <option value="" disabled selected>이름 선택</option>
            ${TEAM_PARTS.map((part) => `
              <optgroup label="${part.name}">
                ${part.members.map((name) => `<option value="${name}">${name}</option>`).join("")}
              </optgroup>
            `).join("")}
          </select>
          <button class="btn btn-primary" id="saveNameBtn">시작하기</button>
        </div>
      </div>
    </div>
    ` : `
    <div class="card" style="margin-bottom:1.5rem">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <span style="font-size:0.9rem;color:var(--text-muted)">훈련 중인 팀원: <strong style="color:var(--accent)">${data.userName}</strong></span>
        <button class="btn btn-secondary" id="changeNameBtn" style="padding:0.5rem 1rem;font-size:0.8rem">팀원 변경</button>
      </div>
    </div>
    `}

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.streak}</div>
        <div class="stat-label">연속 훈련 (일)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.records.length}</div>
        <div class="stat-label">총 훈련 횟수</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgScore}</div>
        <div class="stat-label">평균 점수</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${todayRecord ? "✅" : "⏳"}</div>
        <div class="stat-label">오늘 훈련</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📅 최근 7일 훈련</div>
      <div class="streak-calendar">
        ${last7
          .map((day) => {
            const done = data.completedDays.includes(day);
            const isToday = day === today;
            return `<div class="streak-day ${done ? "done" : ""} ${isToday ? "today" : ""}" title="${day}">
              ${day.slice(5).replace("-", "/")}
            </div>`;
          })
          .join("")}
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="card-title">🎯 오늘의 미션</div>
      <span class="mission-badge">${mission.type}</span>
      <h3 class="mission-title">${mission.title}</h3>
      <p class="mission-desc">${mission.description}</p>
      ${
        todayRecord
          ? `<p style="color:var(--success);font-size:0.9rem">✅ 오늘 훈련 완료! 점수: ${todayRecord.score}점</p>`
          : `<button class="btn btn-primary" id="goTrainingBtn">훈련 시작하기 →</button>`
      }
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="card-title">📚 미션 유형 미리보기</div>
      <table class="guide-table">
        <thead>
          <tr><th>유형</th><th>미션</th><th>핵심 스킬</th></tr>
        </thead>
        <tbody>
          ${MISSIONS.map(
            (m) => `
            <tr>
              <td><span class="mission-badge">${m.type}</span></td>
              <td>${m.title}</td>
              <td style="color:var(--text-muted)">${m.description.slice(0, 30)}...</td>
            </tr>
          `
          ).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("saveNameBtn")?.addEventListener("click", () => {
    const name = document.getElementById("userNameSelect")?.value;
    if (name) {
      setUserName(name);
      render();
    }
  });

  document.getElementById("changeNameBtn")?.addEventListener("click", () => {
    setUserName("");
    render();
  });

  document.getElementById("goTrainingBtn")?.addEventListener("click", () => {
    switchView("training");
  });
}

function renderTraining() {
  const mission = getTodayMission();
  const todayRecord = getTodayRecord();

  mainContent.innerHTML = `
    <div class="card">
      <span class="mission-badge">${mission.type}</span>
      <h2 class="mission-title">${mission.title}</h2>
      <p class="mission-desc">${mission.description}</p>

      <div class="scenario-box">
        <strong>📋 시나리오</strong><br />
        ${mission.scenario}
      </div>

      <div class="card" style="background:var(--bg);margin-bottom:1.5rem">
        <div class="card-title">❌ 나쁜 예 (이렇게 쓰지 마세요)</div>
        <p class="compare-text" style="color:var(--danger)">"${mission.badExample}"</p>
      </div>

      <div class="form-group">
        <label class="form-label">✍️ 나만의 프롬프트 작성</label>
        <p class="form-hint">RCTO(역할·맥락·과제·출력) 프레임워크를 적용해 프롬프트를 작성해 보세요.</p>
        <textarea id="promptInput" placeholder="여기에 프롬프트를 작성하세요...">${todayRecord?.prompt || ""}</textarea>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" id="analyzeBtn">🔍 프롬프트 분석하기</button>
        <button class="btn btn-secondary" id="showMasterBtn">🏆 모범 답안 보기</button>
      </div>
    </div>

    <div id="resultArea"></div>
    <div id="masterArea" class="hidden"></div>
  `;

  document.getElementById("analyzeBtn").addEventListener("click", () => {
    const prompt = document.getElementById("promptInput").value;
    const result = analyzePrompt(prompt, mission.hints);
    currentResult = { ...result, prompt, mission };

    renderResult(result, mission, prompt);

    saveRecord({
      date: getTodayString(),
      missionId: mission.id,
      missionTitle: mission.title,
      missionType: mission.type,
      prompt,
      score: result.score,
      rcto: result.rcto,
    });
  });

  document.getElementById("showMasterBtn").addEventListener("click", () => {
    const area = document.getElementById("masterArea");
    area.classList.toggle("hidden");
    if (!area.classList.contains("hidden")) {
      area.innerHTML = `
        <div class="card result-panel" style="margin-top:1rem">
          <div class="card-title">🏆 모범 프롬프트 (RCTO 적용)</div>
          <div class="compare-text" style="background:var(--bg);padding:1rem;border-radius:8px;border:1px solid var(--success)">
${mission.masterPrompt}
          </div>
          <p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">
            💡 모범 답안을 참고한 후, 내 프롬프트를 다시 수정하고 재분석해 보세요.
          </p>
        </div>
      `;
    }
  });

  if (todayRecord) {
    const result = analyzePrompt(todayRecord.prompt, mission.hints);
    renderResult(result, mission, todayRecord.prompt);
  }
}

function renderResult(result, mission, prompt) {
  const area = document.getElementById("resultArea");
  if (!area) return;

  const rctoLabels = {
    role: { letter: "R", name: "Role (역할)" },
    context: { letter: "C", name: "Context (맥락)" },
    task: { letter: "T", name: "Task (과제)" },
    output: { letter: "O", name: "Output (출력)" },
  };

  area.innerHTML = `
    <div class="card result-panel" style="margin-top:1.5rem">
      <div class="score-display">
        <div class="score-circle ${result.level}">${result.score}</div>
        <div class="score-label">${result.levelLabel}</div>
      </div>

      <div class="card-title">📊 RCTO 체크리스트</div>
      <div class="rcto-grid">
        ${Object.entries(result.rcto)
          .map(
            ([key, val]) => `
          <div class="rcto-item ${val.found ? "found" : "missing"}" data-type="${key}">
            <div class="rcto-letter">${rctoLabels[key].letter}</div>
            <div class="rcto-name">${rctoLabels[key].name}</div>
            <div class="rcto-status">${val.found ? "✅ 포함됨" : "❌ 부족함"}</div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="card-title" style="margin-top:1.5rem">💬 피드백</div>
      <ul class="feedback-list">
        ${result.feedback.map((f) => `<li><span class="icon">→</span>${f}</li>`).join("")}
      </ul>

      <div class="card-title" style="margin-top:1.5rem">🔄 Before / After</div>
      <div class="compare-grid">
        <div class="compare-box before">
          <h4>내 프롬프트 (Before)</h4>
          <div class="compare-text">${escapeHtml(prompt)}</div>
        </div>
        <div class="compare-box after">
          <h4>개선 방향 (After 힌트)</h4>
          <div class="compare-text">${generateImprovementHint(result, mission)}</div>
        </div>
      </div>
    </div>
  `;
}

function generateImprovementHint(result, mission) {
  const missing = Object.entries(result.rcto)
    .filter(([, v]) => !v.found)
    .map(([k]) => k);

  if (missing.length === 0) {
    return "RCTO 4요소가 모두 포함됐습니다!\n모범 답안과 비교하며 세부 표현을 다듬어 보세요.";
  }

  const hints = {
    role: `→ "${mission.hints.role[0]}" 등의 역할을 명시하세요.`,
    context: `→ 배경 상황과 관련 데이터를 [배경] 섹션으로 추가하세요.`,
    task: `→ 구체적인 과제를 번호 목록으로 나열하세요.`,
    output: `→ 출력 형식(표, bullet, 문장 수 등)을 명시하세요.`,
  };

  return missing.map((m) => hints[m]).join("\n");
}

function renderGuide() {
  mainContent.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:0.5rem">RCTO 프롬프트 프레임워크</h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem">
        AI PM이 프롬프트를 작성할 때 사용하는 4가지 핵심 요소입니다.
      </p>

      <div class="rcto-grid">
        ${RCTO_GUIDE.map(
          (item) => `
          <div class="rcto-item found" data-type="${item.color}">
            <div class="rcto-letter">${item.letter}</div>
            <div class="rcto-name">${item.name}</div>
            <p style="font-size:0.8rem;color:var(--text-muted);margin:0.5rem 0">${item.desc}</p>
            <div class="compare-text" style="font-size:0.75rem;color:var(--accent)">${item.example}</div>
          </div>
        `
        ).join("")}
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="card-title">📝 프롬프트 작성 체크리스트</div>
      <table class="guide-table">
        <thead>
          <tr><th>항목</th><th>체크 포인트</th><th>예시</th></tr>
        </thead>
        <tbody>
          <tr><td>역할</td><td>AI에게 전문가 역할 부여</td><td>"너는 10년차 PM이야"</td></tr>
          <tr><td>맥락</td><td>배경, 데이터, 제약 조건</td><td>"리텐션율 5%로 하락 중"</td></tr>
          <tr><td>과제</td><td>구체적 행동 요청</td><td>"상위 5개 카테고리 도출"</td></tr>
          <tr><td>출력</td><td>형식, 길이, 톤 지정</td><td>"표로, 3문장 이내"</td></tr>
          <tr><td>제약</td><td>하지 말 것 명시</td><td>"추측하지 말고"</td></tr>
          <tr><td>구조</td><td>섹션 구분</td><td>[배경] [과제] [출력]</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="card-title">🥋 7가지 프롬프트 유형</div>
      <table class="guide-table">
        <thead>
          <tr><th>유형</th><th>언제 쓰나</th><th>핵심 키워드</th></tr>
        </thead>
        <tbody>
          <tr><td>분석형</td><td>데이터/VOC 구조화</td><td>분석, 카테고리, 근거</td></tr>
          <tr><td>기획형</td><td>PRD, 기획서 작성</td><td>Problem, Metrics, Scope</td></tr>
          <tr><td>비판형</td><td>아이디어 검증</td><td>비판, 약점, 리스크</td></tr>
          <tr><td>변환형</td><td>이해관계자별 문서</td><td>변환, 버전, 대상</td></tr>
          <tr><td>시뮬레이션형</td><td>가상 사용자 테스트</td><td>페르소나, 반응, 우려</td></tr>
          <tr><td>체인형</td><td>단계별 정밀 기획</td><td>Step, 단계, 아직 마</td></tr>
          <tr><td>시스템형</td><td>AI 챗봇 설계</td><td>역할, 규칙, 하지 말 것</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderHistory() {
  const data = loadData();

  if (!data.records.length) {
    mainContent.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📝</div>
        <h3>아직 훈련 기록이 없어요</h3>
        <p>오늘의 훈련을 시작해 보세요!</p>
        <button class="btn btn-primary" style="margin-top:1rem" id="goTrainingBtn">훈련 시작하기</button>
      </div>
    `;
    document.getElementById("goTrainingBtn")?.addEventListener("click", () => switchView("training"));
    return;
  }

  mainContent.innerHTML = `
    <h2 style="margin-bottom:1rem">훈련 기록</h2>
    ${data.records
      .map(
        (r) => `
      <div class="history-item">
        <div class="history-meta">
          <span class="history-date">${r.date}</span>
          <span class="history-score">${r.score}점</span>
        </div>
        <div class="history-mission">
          <span class="mission-badge">${r.missionType}</span>
          ${r.missionTitle}
        </div>
        <div class="history-prompt">${escapeHtml(r.prompt)}</div>
      </div>
    `
      )
      .join("")}
  `;
}

function switchView(view) {
  currentView = view;
  navButtons.forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
  });
  render();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

render();
