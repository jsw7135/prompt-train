const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "TeamHub-NewsBot/1.0" },
});

const FEEDS = [
  { url: "https://www.boannews.com/media/news_rss.xml", source: "보안뉴스", lang: "ko", maxItems: 20, weight: 3 },
  { url: "https://www.etnews.com/rss/Section901.xml", source: "전자신문", lang: "ko", maxItems: 15, weight: 3 },
  { url: "https://www.etnews.com/rss/Section902.xml", source: "전자신문 속보", lang: "ko", maxItems: 15, weight: 3 },
  { url: "https://www.etnews.com/rss/Section903.xml", source: "전자신문 인기", lang: "ko", maxItems: 10, weight: 2 },
  { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News", lang: "en", maxItems: 5, weight: 1 },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer", lang: "en", maxItems: 5, weight: 1 },
  { url: "https://krebsonsecurity.com/feed/", source: "Krebs on Security", lang: "en", maxItems: 4, weight: 1 },
  { url: "https://feeds.arstechnica.com/arstechnica/security", source: "Ars Technica", lang: "en", maxItems: 4, weight: 1 },
];

const CATEGORIES = {
  security: { label: "보안 사고·취약점", keywords: ["hack", "breach", "malware", "ransomware", "vulnerability", "cve", "exploit", "phishing", "attack", "threat", "해킹", "침해", "랜섬", "취약", "악성", "보안사고", "유출", "랜섬웨어"] },
  policy: { label: "정책·규제", keywords: ["regulation", "gdpr", "compliance", "law", "policy", "government", "privacy", "규제", "법률", "정책", "개인정보", "입법", "과징금", "과태료", "개정", "시행령"] },
  "ai-tech": { label: "AI·기술 트렌드", keywords: ["ai", "artificial intelligence", "machine learning", "chatgpt", "llm", "openai", "generative", "인공지능", "생성형", "딥러닝", "gpt", "클로드", "자동화", "반도체", "플랫폼"] },
  infra: { label: "클라우드·인프라", keywords: ["cloud", "aws", "azure", "kubernetes", "server", "datacenter", "infrastructure", "devops", "클라우드", "인프라", "서버", "데이터센터", "배포", "네트워크"] },
  domestic: { label: "국내 이슈", keywords: ["한국", "국내", "정부", "과기정통부", "개인정보위", "금융위", "서울", "삼성", "카카오", "네이버", "kt", "sk", "공공", "국회"] },
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
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  const parts = text
    .split(/(?<=[.!?])\s+|(?<=[다요임음됨함])\.\s+|(?<=[다요임음됨함])\s/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (parts.length > 0) return parts;
  return [text.trim()].filter((s) => s.length > 0);
}

function extractKeywords(title) {
  return title
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function summarizeArticle(title, description, lang) {
  const clean = stripHtml(description);

  if (!clean || clean.length < 20) {
    if (lang === "ko") {
      return `「${title}」 관련 국내 IT·보안 이슈로, 원문에서 상세 내용을 확인할 수 있습니다.`;
    }
    return `「${title}」 관련 해외 보안·IT 이슈입니다. 상세 내용은 원문 기사를 참고하세요.`;
  }

  const sentences = splitSentences(clean);
  const titleKeywords = extractKeywords(title);

  const scored = sentences.map((sentence, index) => {
    let score = 0;
    titleKeywords.forEach((kw) => {
      if (sentence.includes(kw)) score += 4;
    });
    if (index === 0) score += 2;
    if (index === 1) score += 1;
    if (sentence.length >= 30 && sentence.length <= 180) score += 2;
    if (/발표|추진|강화|우려|대응|도입|적용|예정|전망|확대/.test(sentence)) score += 2;
    return { sentence, score, index };
  });

  const topSentences = scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  let summary = topSentences.join(" ");

  if (summary.length < 40 && sentences.length > 0) {
    summary = sentences.slice(0, 2).join(" ");
  }

  if (summary.length > 240) {
    summary = summary.slice(0, 240).replace(/\s+\S*$/, "") + "…";
  }

  if (lang === "en") {
    return `해외 이슈 요약: ${summary}`;
  }

  return summary;
}

function categorize(title, description, lang) {
  const text = `${title} ${description}`.toLowerCase();

  if (lang === "ko") {
    let bestMatch = "domestic";
    let bestScore = 0;

    for (const [key, cat] of Object.entries(CATEGORIES)) {
      if (key === "domestic") continue;
      const score = cat.keywords.filter((kw) => text.includes(kw.toLowerCase())).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    }

    if (bestScore === 0) return "domestic";
    if (bestMatch !== "domestic") return bestMatch;
    return "domestic";
  }

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (key === "domestic") continue;
    if (cat.keywords.some((kw) => text.includes(kw.toLowerCase()))) return key;
  }
  return "security";
}

function isRecent(pubDate, hoursBack = 96) {
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

function sortArticles(articles) {
  return articles.sort((a, b) => {
    const langScore = (b.lang === "ko" ? 2 : 0) - (a.lang === "ko" ? 2 : 0);
    if (langScore !== 0) return langScore;

    const catScore = (b.category === "domestic" ? 1 : 0) - (a.category === "domestic" ? 1 : 0);
    if (catScore !== 0) return catScore;

    const weightScore = (b.weight || 0) - (a.weight || 0);
    if (weightScore !== 0) return weightScore;

    return new Date(b.pubDate) - new Date(a.pubDate);
  });
}

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items = (feed.items || []).slice(0, feedConfig.maxItems || 10);

    return items.map((item) => {
      const title = stripHtml(item.title || "");
      const rawDescription = item.contentSnippet || item.content || item.summary || "";
      const category = categorize(title, rawDescription, feedConfig.lang);

      return {
        title,
        summary: summarizeArticle(title, rawDescription, feedConfig.lang),
        link: item.link || item.guid || "",
        source: feedConfig.source,
        lang: feedConfig.lang,
        weight: feedConfig.weight || 1,
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

    const recentArticles = allArticles.filter((a) => a.title && a.link && isRecent(a.pubDate));

    const seen = new Set();
    const uniqueArticles = sortArticles(recentArticles).filter((a) => {
      const key = a.title.slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const koArticles = uniqueArticles.filter((a) => a.lang === "ko");
    const enArticles = uniqueArticles.filter((a) => a.lang === "en");
    const balancedArticles = [
      ...koArticles.slice(0, 40),
      ...enArticles.slice(0, 12),
    ];

    const finalArticles = sortArticles(balancedArticles);

    const byCategory = {};
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      byCategory[key] = {
        label: cat.label,
        articles: sortArticles(finalArticles.filter((a) => a.category === key)),
      };
    }

    return res.status(200).json({
      success: true,
      date: getKSTDateString(),
      dateKey: getKSTDateKey(),
      updatedAt: new Date().toISOString(),
      totalCount: finalArticles.length,
      domesticCount: finalArticles.filter((a) => a.lang === "ko" || a.category === "domestic").length,
      categories: byCategory,
      articles: finalArticles,
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
