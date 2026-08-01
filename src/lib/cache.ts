// 画面切り替えのたびに「読み込み中...」を見せないためのメモリキャッシュ。
// ページはまずキャッシュを描画し、裏で再取得して差し替える（stale-while-revalidate）。
const store = new Map<string, unknown>();

export const HOME_CACHE_KEY = "home";
export const DONE_CACHE_KEY = "done";
export const taskCacheKey = (id: string) => `task:${id}`;

export function cacheGet<T>(key: string): T | null {
  return (store.get(key) as T | undefined) ?? null;
}

export function cacheSet<T>(key: string, value: T): void {
  store.set(key, value);
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}
