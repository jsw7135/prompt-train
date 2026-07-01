const STORAGE_KEY = "prompt-dojo-data";

const defaultData = {
  userName: "",
  records: [],
  streak: 0,
  lastCompletedDate: null,
  totalScore: 0,
  completedDays: [],
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function setUserName(name) {
  const data = loadData();
  data.userName = name;
  saveData(data);
  return data;
}

export function saveRecord(record) {
  const data = loadData();
  const today = getTodayString();

  const existing = data.records.findIndex((r) => r.date === today);
  if (existing >= 0) {
    data.records[existing] = record;
  } else {
    data.records.unshift(record);
  }

  if (!data.completedDays.includes(today)) {
    data.completedDays.push(today);
  }

  data.lastCompletedDate = today;
  data.streak = calculateStreak(data.completedDays);
  data.totalScore = data.records.reduce((sum, r) => sum + r.score, 0);

  saveData(data);
  return data;
}

export function getTodayRecord() {
  const data = loadData();
  const today = getTodayString();
  return data.records.find((r) => r.date === today);
}

export function calculateStreak(completedDays) {
  if (!completedDays.length) return 0;

  const sorted = [...completedDays].sort().reverse();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = sorted[0] === today ? today : yesterday;

  for (const day of sorted) {
    if (day === checkDate) {
      streak++;
      checkDate = getPreviousDay(checkDate);
    } else if (day < checkDate) {
      break;
    }
  }

  return streak;
}

export function getTodayString() {
  return formatDate(new Date());
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

function getPreviousDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}
