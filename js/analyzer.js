const ROLE_PATTERNS = [
  /너는|당신은|역할|전문가|분석가|기획자|PM|매니저|컨설턴트|투자자|사용자|고객|챗봇|AI/i,
  /시니어|시니어|까다로운|10년|15년|\d+년차/i,
];

const CONTEXT_PATTERNS = [
  /배경|상황|맥락|우리는|현재|이번|데이터|분석 결과|타겟|단계|시장|팀|서비스|앱|기능|기획/i,
  /\[배경\]|\[상황\]|\[데이터\]|VOC|리텐션|하락|CS/i,
];

const TASK_PATTERNS = [
  /작성|분석|도출|정리|제안|변환|비판|검증|정의|수행|안내|답변|예측|시뮬레이션/i,
  /해줘|해주세요|작성해|분석해|도출해|정리해|제안해|변환해|비판해/i,
  /\[과제\]|Step \d|단계/i,
];

const OUTPUT_PATTERNS = [
  /형식|출력|표|목록|문장|이내|글자|JSON|bullet|헤딩|섹션|구분|FAQ/i,
  /\[출력|톤|말투|이모지|하지 말|규칙|As a/i,
  /\d+개|\d+안|\d+가지|페이지/i,
];

export function analyzePrompt(text, hints) {
  const trimmed = text.trim();

  if (trimmed.length < 10) {
    return {
      score: 0,
      level: "low",
      levelLabel: "다시 도전!",
      rcto: buildEmptyRcto(),
      feedback: ["프롬프트가 너무 짧아요. 최소 2~3문장 이상 작성해 보세요."],
    };
  }

  const rcto = {
    role: checkElement(text, ROLE_PATTERNS, hints?.role),
    context: checkElement(text, CONTEXT_PATTERNS, hints?.context),
    task: checkElement(text, TASK_PATTERNS, hints?.task),
    output: checkElement(text, OUTPUT_PATTERNS, hints?.output),
  };

  const foundCount = Object.values(rcto).filter((r) => r.found).length;
  let score = foundCount * 20;

  if (trimmed.length >= 100) score += 5;
  if (trimmed.length >= 200) score += 5;
  if (trimmed.length >= 400) score += 5;

  const hasStructure = /\[.+\]|##|# /m.test(text);
  if (hasStructure) score += 5;

  const hasConstraint = /하지 말|추측하지|아직.*마|범위|제외|Out of Scope/i.test(text);
  if (hasConstraint) score += 5;

  score = Math.min(score, 100);

  const feedback = generateFeedback(rcto, trimmed, hints);
  const { level, levelLabel } = getScoreLevel(score);

  return { score, level, levelLabel, rcto, feedback };
}

function checkElement(text, patterns, hintWords) {
  const patternMatch = patterns.some((p) => p.test(text));
  const hintMatch = hintWords?.some((word) => text.includes(word)) ?? false;
  const found = patternMatch || hintMatch;

  let matchedBy = [];
  if (patternMatch) matchedBy.push("패턴");
  if (hintMatch) {
    const matched = hintWords.filter((w) => text.includes(w));
    matchedBy.push(...matched);
  }

  return { found, matchedBy };
}

function buildEmptyRcto() {
  return {
    role: { found: false, matchedBy: [] },
    context: { found: false, matchedBy: [] },
    task: { found: false, matchedBy: [] },
    output: { found: false, matchedBy: [] },
  };
}

function generateFeedback(rcto, text, hints) {
  const feedback = [];

  if (!rcto.role.found) {
    feedback.push("🎭 Role(역할)이 없어요. \"너는 ○○ 전문가야\"로 AI의 역할을 지정해 보세요.");
  }
  if (!rcto.context.found) {
    feedback.push("📋 Context(맥락)이 부족해요. 배경, 상황, 관련 데이터를 추가해 보세요.");
  }
  if (!rcto.task.found) {
    feedback.push("🎯 Task(과제)가 모호해요. \"○○을 분석/작성/도출해줘\"처럼 구체적으로 요청하세요.");
  }
  if (!rcto.output.found) {
    feedback.push("📐 Output(출력) 형식이 없어요. \"표로\", \"3문장 이내\", \"bullet point로\" 등을 명시하세요.");
  }

  if (text.length < 80) {
    feedback.push("✏️ 조금 더 길게 작성해 보세요. 맥락이 풍부할수록 AI 답변 품질이 올라갑니다.");
  }

  if (!/\[.+\]|##/m.test(text)) {
    feedback.push("🗂️ [배경], [과제], [출력 형식]처럼 섹션을 나누면 구조가 명확해져요.");
  }

  if (!/하지 말|추측하지|범위|제외/i.test(text)) {
    feedback.push("🚫 \"하지 말 것\"이나 \"추측하지 말고\" 같은 제약 조건을 추가하면 환각을 줄일 수 있어요.");
  }

  const allFound = Object.values(rcto).every((r) => r.found);
  if (allFound && text.length >= 150) {
    feedback.push("🎉 RCTO 4요소가 모두 포함됐어요! 훌륭한 프롬프트입니다.");
  }

  return feedback;
}

function getScoreLevel(score) {
  if (score >= 80) return { level: "high", levelLabel: "프롬프트 고수!" };
  if (score >= 50) return { level: "mid", levelLabel: "좋은 시도! 조금만 더" };
  return { level: "low", levelLabel: "다시 도전!" };
}
