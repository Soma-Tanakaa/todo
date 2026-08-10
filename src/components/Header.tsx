"use client";

import { useEffect, useState } from "react";
import { headerDateLabel } from "@/lib/date";
import type { AppView } from "@/lib/types";

const TABS: { value: AppView; label: string }[] = [
  { value: "flow", label: "マインドフロー" },
  { value: "meetings", label: "ミーティング" },
];

export function Header({
  view,
  onChangeView,
}: {
  view: AppView;
  onChangeView: (v: AppView) => void;
}) {
  // 日付はタイムゾーン差でSSRとズレうるため、マウント後に表示する
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(headerDateLabel());
  }, []);

  return (
    <div className="flex items-center justify-between border-b border-divider px-8 py-[14px]">
      <div className="flex items-center gap-6">
        <div className="text-[26px] font-bold">TaskFlowy</div>
        <div className="flex overflow-hidden rounded-lg border border-n400">
          {TABS.map((t, i) => (
            <button
              type="button"
              key={t.value}
              onClick={() => onChangeView(t.value)}
              className={`cursor-pointer px-4 py-[6px] text-[13px] ${
                i > 0 ? "border-l border-divider" : ""
              } ${
                view === t.value
                  ? "bg-accent-100 font-bold text-chip-blue"
                  : "bg-white text-n600 hover:bg-n100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-[22px]">
        {view === "flow" && (
          <div className="flex gap-4 text-xs text-n600">
            <span className="inline-flex items-center gap-[6px]">
              <span className="inline-block h-[10px] w-[10px] border-[1.5px] border-accent bg-white" />
              進行中
            </span>
            <span className="inline-flex items-center gap-[6px]">
              <span className="inline-block h-[10px] w-[10px] border border-n400 bg-white" />
              着手できる
            </span>
            <span className="inline-flex items-center gap-[6px]">
              <span className="inline-block h-[10px] w-[10px] border border-n300 bg-surface" />
              完了
            </span>
          </div>
        )}
        <div className="text-[13px] text-n600">{dateLabel}</div>
      </div>
    </div>
  );
}
