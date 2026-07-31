/** 端末ローカルの今日を YYYY-MM-DD で返す */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** 期限（date文字列）の表示。今日/明日は言葉で、それ以外は M/D（年が違えば Y/M/D） */
export function formatDue(due: string): string {
  const now = new Date();
  if (due === todayStr()) return "今日";
  const [y, m, d] = due.split("-").map(Number);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (
    y === tomorrow.getFullYear() &&
    m === tomorrow.getMonth() + 1 &&
    d === tomorrow.getDate()
  ) {
    return "明日";
  }
  return y === now.getFullYear() ? `${m}/${d}` : `${y}/${m}/${d}`;
}

/** timestamptz の表示。M/D（年が違えば Y/M/D） */
export function formatTs(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    ? `${d.getMonth() + 1}/${d.getDate()}`
    : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
