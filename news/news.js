const CATEGORY_ORDER = ["all", "domestic", "security", "policy", "ai-tech", "infra"];

const CATEGORY_LABELS = {
  all: "전체",
  domestic: "국내 이슈",
  security: "보안 사고·취약점",
  policy: "정책·규제",
  "ai-tech": "AI·기술 트렌드",
  infra: "클라우드·인프라",
};

let newsData = null;
let activeCategory = "domestic";

const newsMeta = document.getElementById("newsMeta");
const categoryTabs = document.getElementById("categoryTabs");
const newsContent = document.getElementById("newsContent");

async function loadNews() {
  showLoading();

  try {
    const res = await fetch("/api/news");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    newsData = await res.json();
    if (!newsData.success) throw new Error(newsData.error || "데이터 오류");

    renderMeta();
    renderTabs();
    renderArticles();
  } catch (err) {
    showError(err.message);
  }
}

function showLoading() {
  newsMeta.innerHTML = "";
  categoryTabs.innerHTML = "";
  newsContent.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>최신 보안·IT 뉴스를 불러오는 중…</p>
    </div>
  `;
}

function showError(message) {
  newsContent.innerHTML = `
    <div class="error-state">
      <p>⚠️ 뉴스를 불러오지 못했습니다.</p>
      <p style="font-size:0.85rem;margin-top:0.5rem">${message}</p>
      <button class="btn-retry" onclick="location.reload()">다시 시도</button>
    </div>
  `;
}

function renderMeta() {
  newsMeta.innerHTML = `
    <span class="news-date-badge">📅 ${newsData.date}</span>
    <span class="news-count">총 ${newsData.totalCount}건 · 국내 ${newsData.domesticCount || 0}건 · 매일 자동 업데이트</span>
  `;
}

function renderTabs() {
  const counts = { all: newsData.totalCount };

  for (const key of CATEGORY_ORDER) {
    if (key === "all") continue;
    counts[key] = newsData.categories[key]?.articles?.length || 0;
  }

  categoryTabs.innerHTML = CATEGORY_ORDER.map((key) => {
    const count = counts[key];
    if (key !== "all" && count === 0) return "";
    return `
      <button class="cat-tab ${key === activeCategory ? "active" : ""}" data-cat="${key}">
        ${CATEGORY_LABELS[key]}${count > 0 ? ` (${count})` : ""}
      </button>
    `;
  }).join("");

  categoryTabs.querySelectorAll(".cat-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderTabs();
      renderArticles();
    });
  });
}

function getArticles() {
  if (activeCategory === "all") return newsData.articles;
  return newsData.categories[activeCategory]?.articles || [];
}

function renderArticles() {
  const articles = getArticles();

  if (!articles.length) {
    newsContent.innerHTML = `
      <div class="empty-state">
        <p>이 카테고리에 해당하는 최신 기사가 없습니다.</p>
      </div>
    `;
    return;
  }

  newsContent.innerHTML = `
    <div class="news-list">
      ${articles.map((article) => `
        <article class="news-card">
          <div class="news-card-header">
            <span class="news-cat-badge cat-${article.category}">${article.categoryLabel}</span>
            <span class="news-source">${article.source}${article.lang === "en" ? " · EN" : ""}</span>
            <span class="news-time">${article.relativeTime}</span>
          </div>
          <h3>${escapeHtml(article.title)}</h3>
          <p class="news-summary-label">📋 핵심 요약</p>
          <p class="news-summary">${escapeHtml(article.summary)}</p>
          <a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer" class="news-link">
            상세 기사 보기 →
          </a>
        </article>
      `).join("")}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

loadNews();
