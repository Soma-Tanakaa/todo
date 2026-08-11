"use client";

import { useState, type FormEvent } from "react";
import {
  formatMD,
  formatMDW,
  formatTimeRange,
  parseDueInput,
  parseTimeInput,
} from "@/lib/date";
import { toast } from "@/lib/toast";
import type { NodeRow } from "@/lib/types";

export type MeetingDialogState =
  | { mode: "add"; parentId: string | null; parentTitle: string | null }
  | { mode: "edit"; node: NodeRow };

export interface MeetingSavePatch {
  title: string;
  due_date: string | null;
  meet_start: string | null;
  meet_end: string | null;
  attendees: string | null;
  meeting_url: string | null;
  note: string | null;
}

interface MeetingDialogProps {
  state: MeetingDialogState;
  onClose: () => void;
  onCreate: (input: { parentId: string | null } & MeetingSavePatch) => void;
  onSave: (id: string, patch: MeetingSavePatch) => void;
  onDelete: (id: string) => void;
  /** addモードのみ: 種別を「タスク」に切り替える */
  onSwitchToTask?: () => void;
  /** ツリーへの追加時のみ: 配置候補(一覧タブで作った未終了の単独ミーティング) */
  attachable?: NodeRow[];
  /** 配置候補を選んだとき(親ノードの子として配置する) */
  onAttach?: (meetingId: string) => void;
}

export function MeetingDialog({
  state,
  onClose,
  onCreate,
  onSave,
  onDelete,
  onSwitchToTask,
  attachable,
  onAttach,
}: MeetingDialogProps) {
  const isEdit = state.mode === "edit";
  const [title, setTitle] = useState(isEdit ? state.node.title : "");
  const [due, setDue] = useState(
    isEdit && state.node.due_date ? formatMD(state.node.due_date) : ""
  );
  const [start, setStart] = useState(isEdit ? (state.node.meet_start ?? "") : "");
  const [end, setEnd] = useState(isEdit ? (state.node.meet_end ?? "") : "");
  const [attendees, setAttendees] = useState(
    isEdit ? (state.node.attendees ?? "") : ""
  );
  const [url, setUrl] = useState(isEdit ? (state.node.meeting_url ?? "") : "");
  const [note, setNote] = useState(isEdit ? (state.node.note ?? "") : "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const heading = isEdit ? "ミーティングを編集" : "ミーティングを追加";
  const sub = isEdit
    ? `「${state.node.title}」の内容を変更します`
    : state.parentTitle
      ? `「${state.parentTitle}」の下にミーティングカードを追加します`
      : "ミーティング一覧に追加します（マインドフローには表示されません）";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const parsedDue = parseDueInput(due);
    if (!parsedDue.ok) {
      toast("日付は「8/15」の形式で入力してください");
      return;
    }
    const ps = parseTimeInput(start);
    const pe = parseTimeInput(end);
    if (!ps.ok || !pe.ok) {
      toast("時刻は「14:00」の形式で入力してください");
      return;
    }
    if (pe.hm && !ps.hm) {
      toast("開始時刻を入力してください");
      return;
    }
    if (ps.hm && pe.hm && pe.hm <= ps.hm) {
      toast("終了時刻は開始時刻より後にしてください");
      return;
    }
    let u = url.trim();
    if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
    const patch: MeetingSavePatch = {
      title: t,
      due_date: parsedDue.iso,
      meet_start: ps.hm,
      meet_end: pe.hm,
      attendees: attendees.trim() || null,
      meeting_url: u || null,
      note: note.trim() || null,
    };
    if (state.mode === "add") {
      onCreate({ parentId: state.parentId, ...patch });
    } else {
      onSave(state.node.id, patch);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(32,31,29,0.32)]"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] rounded-xl border border-n400 bg-white p-[26px_28px] shadow-dialog"
      >
        <div className="text-[20px] font-bold">{heading}</div>
        <div className="mt-1 border-b border-divider pb-[14px] text-xs text-n600">
          {sub}
        </div>
        {state.mode === "add" && onSwitchToTask && (
          <div className="mt-4">
            <div className="mb-[6px] text-xs tracking-[2px] text-n600">種別</div>
            <div className="flex overflow-hidden rounded-lg border border-n400">
              <button
                type="button"
                onClick={onSwitchToTask}
                className="flex-1 cursor-pointer bg-white py-2 text-[13px] text-n600 hover:bg-n100"
              >
                タスク
              </button>
              <button
                type="button"
                className="flex-1 cursor-default border-l border-divider bg-accent-100 py-2 text-[13px] font-bold text-chip-blue"
              >
                ミーティング
              </button>
            </div>
          </div>
        )}
        {state.mode === "add" &&
          onAttach &&
          attachable &&
          attachable.length > 0 && (
            <div className="mt-4">
              <div className="mb-[6px] text-xs tracking-[2px] text-n600">
                作成済みのミーティングを配置
              </div>
              <div className="flex max-h-[168px] flex-col gap-[6px] overflow-auto">
                {attachable.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => onAttach(m.id)}
                    className="cursor-pointer rounded-lg border border-n400 bg-white px-3 py-2 text-left hover:bg-accent-100"
                  >
                    <div className="truncate text-[13px] font-bold text-n900">
                      {m.title}
                    </div>
                    <div className="truncate text-[11.5px] text-n600 tabular-nums">
                      {m.due_date ? formatMDW(m.due_date) : "日付未定"}
                      {formatTimeRange(m.meet_start, m.meet_end) &&
                        ` ${formatTimeRange(m.meet_start, m.meet_end)}`}
                      {m.attendees ? ` ・ ${m.attendees}` : ""}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 border-b border-divider" />
              <div className="mt-3 text-xs text-n600">または新しく作成する</div>
            </div>
          )}
        <div className="mt-4">
          <div className="mb-[6px] text-xs tracking-[2px] text-n600">
            ミーティング名
          </div>
          <input
            className="input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：クライアント定例"
          />
        </div>
        <div className="mt-[14px] flex gap-[10px]">
          <div className="flex-1">
            <div className="mb-[6px] text-xs tracking-[2px] text-n600">
              日付（任意）
            </div>
            <input
              className="input"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="例：8/15"
            />
          </div>
          <div className="flex-1">
            <div className="mb-[6px] text-xs tracking-[2px] text-n600">開始</div>
            <input
              className="input"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="例：14:00"
            />
          </div>
          <div className="flex-1">
            <div className="mb-[6px] text-xs tracking-[2px] text-n600">終了</div>
            <input
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="例：15:00"
            />
          </div>
        </div>
        <div className="mt-[14px]">
          <div className="mb-[6px] text-xs tracking-[2px] text-n600">
            参加者（任意）
          </div>
          <input
            className="input"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="例：田中さん、佐藤さん"
          />
        </div>
        <div className="mt-[14px]">
          <div className="mb-[6px] text-xs tracking-[2px] text-n600">
            ミーティングURL（任意）
          </div>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="例：https://meet.google.com/…"
          />
        </div>
        <div className="mt-[14px]">
          <div className="mb-[6px] text-xs tracking-[2px] text-n600">
            メモ（任意）
          </div>
          <textarea
            className="input resize-y"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="アジェンダや参考リンクなど"
          />
        </div>
        <div
          className={`mt-[22px] flex items-center ${isEdit ? "justify-between" : "justify-end"}`}
        >
          {isEdit && (
            <button
              type="button"
              onClick={() =>
                confirmDelete ? onDelete(state.node.id) : setConfirmDelete(true)
              }
              className="cursor-pointer text-[13px] text-overdue hover:underline"
            >
              {confirmDelete ? "本当に削除する" : "削除"}
            </button>
          )}
          <div className="flex gap-[10px]">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "保存" : "追加"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
