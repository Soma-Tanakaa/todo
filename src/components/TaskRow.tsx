"use client";

import Link from "next/link";
import { formatDue } from "@/lib/date";
import { progressOf, type HomeTask } from "@/lib/types";
import { IconFlag, IconRepeat } from "./icons";

export function TaskRow({
  task,
  overdue,
  onComplete,
}: {
  task: HomeTask;
  overdue?: boolean;
  onComplete: (t: HomeTask) => void;
}) {
  const prog = progressOf(task.subtasks);
  const hasMeta = task.due_date || prog || task.repeat || task.flagged;
  return (
    <li className="relative border-b border-gray-100">
      <span
        className={`absolute top-0 left-0 h-full w-1 ${
          task.type === "must" ? "bg-must" : "bg-want"
        }`}
      />
      <div className="flex items-center gap-1 pr-2 pl-3">
        <button
          aria-label={`「${task.title}」を完了にする`}
          onClick={() => onComplete(task)}
          className="group flex h-12 w-9 shrink-0 items-center justify-center"
        >
          <span className="h-[22px] w-[22px] rounded-full border-2 border-gray-300 group-active:border-gray-500 group-active:bg-gray-100" />
        </button>
        <Link
          href={`/task/${task.id}`}
          prefetch={true}
          className="flex min-w-0 flex-1 flex-col justify-center py-2.5 active:bg-gray-50"
        >
          <span className="truncate text-[15px] leading-5">{task.title}</span>
          {hasMeta && (
            <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
              {task.due_date && (
                <span className={overdue ? "text-overdue font-medium" : ""}>
                  {formatDue(task.due_date)}
                </span>
              )}
              {prog && (
                <span>
                  {prog.done}/{prog.total}
                </span>
              )}
              {task.repeat && <IconRepeat size={12} className="text-gray-400" />}
              {task.flagged && <IconFlag size={12} className="text-amber-500" />}
            </span>
          )}
        </Link>
      </div>
    </li>
  );
}
