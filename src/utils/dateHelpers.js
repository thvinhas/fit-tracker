export const getLocalDayKey = (timestampMs) => {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTimestampMs = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return 0;
};

export const getLogTimestampMs = (log) => getTimestampMs(log?.date);

export const computeStreak = (logs) => {
  const keys = new Set(
    logs.map((log) => getLocalDayKey(getLogTimestampMs(log))),
  );
  if (keys.size === 0) return 0;

  const anchor = new Date();
  anchor.setHours(0, 0, 0, 0);
  let checkDate = new Date(anchor);

  if (!keys.has(getLocalDayKey(checkDate.getTime()))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let streak = 0;
  while (keys.has(getLocalDayKey(checkDate.getTime()))) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
};

export const sessionsThisWeek = (logs) => {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return logs.filter((log) => getLogTimestampMs(log) >= weekAgo).length;
};

export const sortLogsByDateDesc = (logs) => {
  return [...logs].sort((a, b) => getLogTimestampMs(b) - getLogTimestampMs(a));
};
