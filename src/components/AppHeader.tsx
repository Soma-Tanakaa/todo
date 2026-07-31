"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconBack } from "./icons";

export function AppHeader({
  title,
  back,
  right,
}: {
  title: string;
  /** true なら履歴を戻る。文字列ならそのパスへのリンク */
  back?: true | string;
  right?: ReactNode;
}) {
  const router = useRouter();
  const backCls =
    "-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 active:bg-gray-100";
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-12 items-center gap-1 px-3">
        {back === true && (
          <button onClick={() => router.back()} aria-label="戻る" className={backCls}>
            <IconBack size={22} />
          </button>
        )}
        {typeof back === "string" && (
          <Link href={back} aria-label="戻る" className={backCls}>
            <IconBack size={22} />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate px-1 text-[17px] font-bold">{title}</h1>
        {right}
      </div>
    </header>
  );
}
