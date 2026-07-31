"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { fetchDoneTasks } from "@/lib/data";
import { formatTs } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Task } from "@/lib/types";

export default function DonePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[] | null>(null);

  const load = useCallback(async () => {
    try {
      setTasks(await fetchDoneTasks());
    } catch {
      toast("読み込みに失敗しました");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <AppHeader back="/" title="完了リスト" />
      <main className="pb-10">
        {!tasks ? (
          <p className="p-10 text-center text-sm text-gray-400">読み込み中...</p>
        ) : tasks.length === 0 ? (
          <p className="px-8 py-20 text-center text-sm text-gray-400">
            完了したタスクはまだありません
          </p>
        ) : (
          <ul>
            {tasks.map((t) => (
              <li key={t.id} className="relative border-b border-gray-100">
                <span
                  className={`absolute top-0 left-0 h-full w-1 ${
                    t.type === "must" ? "bg-must" : "bg-want"
                  } opacity-40`}
                />
                <Link
                  href={`/task/${t.id}`}
                  className="flex items-center justify-between gap-3 py-3 pr-4 pl-5 active:bg-gray-50"
                >
                  <span className="min-w-0 truncate text-[15px] text-gray-600">
                    {t.title}
                  </span>
                  {t.completed_at && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatTs(t.completed_at)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-14 pb-8 text-center">
          <button
            onClick={logout}
            className="text-xs text-gray-400 underline underline-offset-2"
          >
            ログアウト
          </button>
        </div>
      </main>
    </>
  );
}
