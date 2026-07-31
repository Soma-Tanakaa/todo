"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("メールアドレスまたはパスワードが正しくありません");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("サインインに失敗しました。接続設定を確認してください");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 pb-24">
      <h1 className="text-center text-2xl font-bold">進捗帖</h1>
      <p className="mt-1 text-center text-xs text-gray-400">
        毎朝開いて、今日やるべきことが一目でわかる
      </p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-gray-400"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-gray-400"
        />
        {error && <p className="text-overdue text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-gray-900 py-3 text-[15px] font-semibold text-white active:opacity-80 disabled:opacity-50"
        >
          {loading ? "サインイン中..." : "サインイン"}
        </button>
      </form>
    </main>
  );
}
