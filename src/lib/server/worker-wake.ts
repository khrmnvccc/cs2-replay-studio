import "server-only";
import { env } from "./env";

/**
 * Bulutdagi worker'ni (GitHub Actions) darhol ishga tushiradi, 10 daqiqalik jadvalni kutmasdan.
 * GITHUB_DISPATCH_TOKEN bo'lmasa hech narsa qilmaydi. Workflow'dagi concurrency guruhi
 * ortiqcha chaqiruvlarni bitta kutayotgan ishga birlashtiradi.
 */
export async function wakeCloudWorker(): Promise<void> {
  const { GITHUB_DISPATCH_TOKEN: token, GITHUB_REPO: repo } = env();
  if (!token) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/worker.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ ref: "main" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("worker wake", res.status, (await res.text()).slice(0, 200));
  } catch (e) {
    console.error("worker wake", e);
  }
}
