/** 按本地日历生成 YYYY-MM-DD；纯日期按本地中午解析，避免按 UTC 解析后跨到前一天。 */
export function dateKey(value = new Date()) {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(value, amount) {
  const date = new Date(`${dateKey(value)}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function formatDate(value, options = {}) {
  if (!value) return "未设置日期";
  const date = new Date(`${dateKey(value)}T12:00:00`);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function startOfWeek(value = new Date()) {
  const date = new Date(`${dateKey(value)}T12:00:00`);
  // getDay() 以周日为 0；偏移后以周一为一周起点，与周条和统计图保持一致。
  return addDays(date, -((date.getDay() + 6) % 7));
}

export function weekdayLabel(value) {
  return new Date(`${dateKey(value)}T12:00:00`).toLocaleDateString("zh-CN", {
    weekday: "long",
  });
}

export function monthLabel(value = new Date()) {
  return new Date(`${dateKey(value)}T12:00:00`).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });
}
