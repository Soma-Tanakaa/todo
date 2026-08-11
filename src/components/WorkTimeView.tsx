"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMD, toIso, todayIso } from "@/lib/date";
import type { WorkSession } from "@/lib/types";

interface WorkTimeViewProps {
  sessions: WorkSession[] | null;
  onStart: () => void;
  onStop: (id: string) => void;
}

/**
 * 勤務時間タブ。大きなタイマー + 月カレンダー(日ごとの労働時間) + 月合計。
 * 経過時間は常に「現在時刻 - started_at」で計算するため、
 * スリープやブラウザ終了をまたいでも停止を押すまで実時間で進み続ける
 */
export function WorkTimeView({ sessions, onStart, onStop }: WorkTimeViewProps) {
  // 1秒ごとに現在時刻を更新。スリープ復帰直後はintervalが遅れることがあるため
  // focus/visibilitychange でも即座に取り直す
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const upd = () => setNow(Date.now());
    const timer = setInterval(upd, 1000);
    window.addEventListener("focus", upd);
    document.addEventListener("visibilitychange", upd);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", upd);
      document.removeEventListener("visibilitychange", upd);
    };
  }, []);

  // 表示する月(カレンダーの ‹ › で移動)
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const moveMonth = (diff: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + diff, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const running = useMemo(
    () => (sessions ?? []).find((s) => !s.ended_at) ?? null,
    [sessions]
  );
  const elapsed = running
    ? Math.max(0, now - Date.parse(running.started_at))
    : 0;

  // 日ごとの稼働ミリ秒(稼働中セッション込み。秒針に合わせて毎秒更新される)
  const daily = useMemo(() => dailyTotals(sessions ?? [], now), [sessions, now]);

  const today = todayIso();
  const todayMs = daily.get(today) ?? 0;

  const monthPrefix = `${month.y}-${String(month.m + 1).padStart(2, "0")}`;
  let monthMs = 0;
  daily.forEach((v, k) => {
    if (k.startsWith(monthPrefix)) monthMs += v;
  });

  const isCurrentMonth = today.startsWith(monthPrefix);

  // カレンダーのマス(日曜始まり。月初の曜日ぶんは null で埋める)
  const cells = useMemo(() => {
    const blanks = new Date(month.y, month.m, 1).getDay();
    const days = new Date(month.y, month.m + 1, 0).getDate();
    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  }, [month]);

  return (
    <div className="flex-1 overflow-auto bg-n100">
      <div className="mx-auto max-w-[680px] px-8 py-7">
        <span className="text-xs tracking-[3px] text-n600">勤務時間</span>

        {/* タイマー */}
        <div className="mt-4 rounded-2xl border border-n400 bg-white px-8 py-9 text-center shadow-card">
          <div
            className={`text-[64px] leading-none font-bold tabular-nums ${
              running ? "text-n900" : "text-n400"
            }`}
          >
            {formatElapsed(elapsed)}
          </div>
          <div className="mt-4 text-[12.5px] text-n600">
            {sessions === null
              ? "読み込み中…"
              : running
                ? `開始 ${startLabel(running.started_at, today)} ・ 今日の合計 ${formatHM(todayMs)}`
                : `今日の合計 ${formatHM(todayMs)}`}
          </div>
          {running ? (
            <button
              type="button"
              onClick={() => onStop(running.id)}
              className="mt-5 cursor-pointer rounded-full bg-soon px-12 py-3 text-[15px] font-bold text-white select-none hover:bg-[#d43a3f]"
            >
              ■ 停止
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              disabled={sessions === null}
              className="mt-5 cursor-pointer rounded-full bg-accent px-12 py-3 text-[15px] font-bold text-white select-none hover:bg-accent-600 disabled:cursor-default disabled:bg-n400"
            >
              ▶ 開始
            </button>
          )}
          <div className="mt-3 text-[11.5px] text-n500">
            スリープやPCの電源を切ってもタイマーは進み続けます(停止を押すまで)
          </div>
        </div>

        {/* カレンダー + 月合計 */}
        <div className="mt-5 rounded-2xl border border-n400 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="cursor-pointer rounded-lg px-3 py-1 text-[15px] text-n600 select-none hover:bg-n100"
              >
                ‹
              </button>
              <div className="min-w-[110px] text-center text-[15px] font-bold">
                {month.y}年{month.m + 1}月
              </div>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="cursor-pointer rounded-lg px-3 py-1 text-[15px] text-n600 select-none hover:bg-n100"
              >
                ›
              </button>
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    setMonth({ y: d.getFullYear(), m: d.getMonth() });
                  }}
                  className="ml-1 cursor-pointer rounded-lg border border-n400 px-3 py-1 text-xs text-n600 select-none hover:bg-n100"
                >
                  今月へ
                </button>
              )}
            </div>
            <div className="text-right">
              <div className="text-[11px] text-n600">月合計</div>
              <div className="text-[20px] leading-tight font-bold tabular-nums">
                {formatHM(monthMs)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-[6px]">
            {"日月火水木金土".split("").map((w) => (
              <div key={w} className="text-center text-[11px] text-n500">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`b-${i}`} />;
              const iso = `${monthPrefix}-${String(day).padStart(2, "0")}`;
              const ms = daily.get(iso) ?? 0;
              const isToday = iso === today;
              return (
                <div
                  key={iso}
                  className={`flex min-h-[56px] flex-col rounded-lg border p-[6px] ${
                    isToday
                      ? "border-accent bg-accent-100"
                      : ms > 0
                        ? "border-n300"
                        : "border-transparent"
                  }`}
                >
                  <div
                    className={`text-[11px] ${isToday ? "font-bold text-chip-blue" : "text-n600"}`}
                  >
                    {day}
                  </div>
                  {ms >= 60000 && (
                    <div className="mt-auto text-right text-[12.5px] font-bold tabular-nums text-n900">
                      {formatCellHM(ms)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-[11.5px] text-n500">
            日付をまたいだ勤務は日ごとに分割して集計されます。
          </div>
        </div>
      </div>
    </div>
  );
}

/** セッション群を日ごとの稼働ミリ秒に集計する。日跨ぎ区間は日付境界で分割 */
function dailyTotals(sessions: WorkSession[], nowMs: number): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    let t = Date.parse(s.started_at);
    const end = s.ended_at ? Date.parse(s.ended_at) : nowMs;
    while (t < end) {
      const d = new Date(t);
      const dayEnd = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + 1
      ).getTime();
      const seg = Math.min(end, dayEnd);
      const key = toIso(d);
      map.set(key, (map.get(key) ?? 0) + (seg - t));
      t = seg;
    }
  }
  return map;
}

/** タイマーの大表示 "01:23:45"(時は2桁保証、24時間超も繰り上げない) */
function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 合計表示用 "62時間30分" / "45分" */
function formatHM(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

/** カレンダーのマス用 "7:30"(時:分) */
function formatCellHM(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** 稼働中セッションの開始表示。当日は "14:32"、前日以前は "8/10 23:12" */
function startLabel(startedAt: string, today: string): string {
  const d = new Date(Date.parse(startedAt));
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const iso = toIso(d);
  return iso === today ? hm : `${formatMD(iso)} ${hm}`;
}
