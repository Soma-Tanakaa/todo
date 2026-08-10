"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatMDW,
  formatTimeRange,
  isMeetingEnded,
  nowHM,
  todayIso,
} from "@/lib/date";
import type { NodeRow } from "@/lib/types";

interface MeetingsViewProps {
  meetings: NodeRow[];
  today: string | null;
  onAdd: () => void;
  onEdit: (node: NodeRow) => void;
}

/** ミーティング一覧タブ。直近の予定を上から順に表示する */
export function MeetingsView({ meetings, today, onAdd, onEdit }: MeetingsViewProps) {
  // 「現在時刻」はこのビューだけが使うため自前で持つ(マップ側を毎分再レンダーさせない)
  const [now, setNow] = useState(() => nowHM());
  useEffect(() => {
    const upd = () => setNow(nowHM());
    const timer = setInterval(upd, 60_000);
    window.addEventListener("focus", upd);
    document.addEventListener("visibilitychange", upd);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", upd);
      document.removeEventListener("visibilitychange", upd);
    };
  }, []);
  const [showEnded, setShowEnded] = useState(false);

  const t = today ?? todayIso();
  const { upcoming, undated, ended } = useMemo(() => {
    const upcoming: NodeRow[] = [];
    const undated: NodeRow[] = [];
    const ended: NodeRow[] = [];
    for (const m of meetings) {
      if (!m.due_date) undated.push(m);
      else if (isMeetingEnded(m.due_date, m.meet_end, t, now)) ended.push(m);
      else upcoming.push(m);
    }
    const nearFirst = (a: NodeRow, b: NodeRow) =>
      a.due_date!.localeCompare(b.due_date!) ||
      (a.meet_start ?? "99:99").localeCompare(b.meet_start ?? "99:99") ||
      a.created_at.localeCompare(b.created_at);
    upcoming.sort(nearFirst);
    ended.sort((a, b) => -nearFirst(a, b)); // 終了済みは新しい順
    return { upcoming, undated, ended };
  }, [meetings, t, now]);

  return (
    <div className="flex-1 overflow-auto bg-n100">
      <div className="mx-auto max-w-[760px] px-8 py-7">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[3px] text-n600">
            ミーティング ─ 予定が近い順
          </span>
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            ＋ ミーティングを追加
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-n500">
              予定されているミーティングはありません。「＋
              ミーティングを追加」から登録できます。
            </div>
          ) : (
            upcoming.map((m) => (
              <MeetingRow key={m.id} m={m} today={t} onEdit={onEdit} />
            ))
          )}
        </div>

        {undated.length > 0 && (
          <div className="mt-8">
            <div className="text-xs tracking-[3px] text-n600">日付未定</div>
            <div className="mt-3 flex flex-col gap-3">
              {undated.map((m) => (
                <MeetingRow key={m.id} m={m} today={t} onEdit={onEdit} />
              ))}
            </div>
          </div>
        )}

        {ended.length > 0 && (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowEnded((v) => !v)}
              className="cursor-pointer text-xs tracking-[1px] text-n600 hover:text-n900"
            >
              {showEnded ? "▾" : "▸"} 終了したミーティング（{ended.length}）
            </button>
            {showEnded && (
              <div className="mt-3 flex flex-col gap-3">
                {ended.map((m) => (
                  <MeetingRow key={m.id} m={m} today={t} ended onEdit={onEdit} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-[11.5px] text-n500">
          終了したミーティングは一覧から消えますが、データとマインドフロー上のカードは残ります。
        </div>
      </div>
    </div>
  );
}

function MeetingRow({
  m,
  today,
  ended = false,
  onEdit,
}: {
  m: NodeRow;
  today: string;
  ended?: boolean;
  onEdit: (node: NodeRow) => void;
}) {
  const time = formatTimeRange(m.meet_start, m.meet_end);
  const isToday = !ended && m.due_date === today;
  return (
    <div
      onClick={() => onEdit(m)}
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-[18px] py-[14px] ${
        ended
          ? "border-n300 bg-n200"
          : "border-n400 bg-white shadow-card hover:bg-accent-100"
      }`}
    >
      <div className="w-[96px] shrink-0">
        <div
          className={`text-[15px] font-bold whitespace-nowrap ${ended ? "text-n500" : "text-n900"}`}
        >
          {m.due_date ? formatMDW(m.due_date) : "未定"}
        </div>
        {isToday && (
          <div className="text-[11px] font-bold text-soon">今日</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-[15px] font-bold ${ended ? "text-n500" : "text-n900"}`}
        >
          {m.title}
        </div>
        <div
          className={`mt-[2px] flex gap-3 text-[12.5px] ${ended ? "text-n500" : "text-n600"}`}
        >
          {time && <span className="tabular-nums whitespace-nowrap">{time}</span>}
          {m.attendees && <span className="truncate">{m.attendees}</span>}
        </div>
      </div>
      {m.meeting_url && !ended && (
        <a
          href={m.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn btn-primary shrink-0"
        >
          参加
        </a>
      )}
    </div>
  );
}
