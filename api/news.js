const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "TeamHub-NewsBot/1.0" },
});

const FEEDS = [
  { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News", lang: "en" },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer", lang: "en" },
  { url: "https://krebsonsecurity.com/feed/", source: "Krebs on Security", lang: "en" },
  { url: "https://feeds.arstechnica.com/arstechnica/security", source: "Ars Technica", lang: "en" },
  { url: "https://www.boannews.com/media/news_rss.xml", source: "보안뉴스", lang: "ko" },
  { url: "https://www.etnews.com/rss/Section901.xml", source: "전자신문", lang: "ko" },
];

const CATEGORIES = {
  security: { label: "보안 사고·취약점", keywords: ["hack", "breach", "malware", "ransomware", "vulnerability", "cve", "exploit", "phishing", "attack", "threat", "해킹", "침해", "랜섬", "취약", "악성", "보안사고", "유출"] },
  policy: { label: "정책·규제", keywords: ["regulation", "gdpr", "compliance", "law", "policy", "government", "privacy", "규제", "법률", "정책", "개인정보", "입법", "과징금", "과태료"] },
  "ai-tech": { label: "AI·기술 트렌드", keywords: ["ai", "artificial intelligence", "machine learning", "chatgpt", "llm", "openai", "generative", "인공지능", "생성형", "딥러닝", "gpt", "클로드", "자동화"] },
  infra: { label: "클라우드·인프라", keywords: ["cloud", "aws", "azure", "kubernetes", "server", "datacenter", "infrastructure", "devops", "클라우드", "인프라", "서버", "데이터센터", "배포"] },
  domestic: { label: "국내 이슈", keywords: [] },
};

function getKSTDateString() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function getKSTDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(text, maxLen = 150) {
  const clean = stripHtml(text);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).trim() + "…";
}

function categorize(title, description, lang) {
  const text = `${title} ${description}`.toLowerCase();

  if (lang === "ko") {
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      if (key === "domestic") continue;
      if (cat.keywords.some((kw) => text.includes(kw.toLowerCase()))) return key;
    }
    return "domestic";
  }

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (key === "domestic") continue;
    if (cat.keywords.some((kw) => text.includes(kw.toLowerCase()))) return key;
  }
  return "security";
}

function isRecent(pubDate, hoursBack = 72) {
  if (!pubDate) return true;
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return true;
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

function formatRelativeTime(pubDate) {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).map((item) => {
      const title = stripHtml(item.title || "");
      const description = item.contentSnippet || item.content || item.summary || "";
      const category = categorize(title, description, feedConfig.lang);

      return {
        title,
        summary: summarize(description),
        link: item.link || item.guid || "",
        source: feedConfig.source,
        lang: feedConfig.lang,
        category,
        categoryLabel: CATEGORIES[category].label,
        pubDate: item.pubDate || item.isoDate || "",
        relativeTime: formatRelativeTime(item.pubDate || item.isoDate),
      };
    });
  } catch (err) {
    console.error(`Feed error [${feedConfig.source}]:`, err.message);
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const allArticles = results.flat();

    const recentArticles = allArticles
      .filter((a) => a.title && a.link && isRecent(a.pubDate))
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const seen = new Set();
    const uniqueArticles = recentArticles.filter((a) => {
      const key = a.title.slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const byCategory = {};
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      byCategory[key] = {
        label: cat.label,
        articles: uniqueArticles.filter((a) => a.category === key),
      };
    }

    return res.status(200).json({
      success: true,
      date: getKSTDateString(),
      dateKey: getKSTDateKey(),
      updatedAt: new Date().toISOString(),
      totalCount: uniqueArticles.length,
      categories: byCategory,
      articles: uniqueArticles.slice(0, 50),
    });
  } catch (error) {
    console.error("News API error:", error);
    return res.status(500).json({
      success: false,
      error: "뉴스를 불러오는 중 오류가 발생했습니다.",
      message: error.message,
    });
  }
};
