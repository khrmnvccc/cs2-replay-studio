import { spawn } from "node:child_process";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Tashqi dasturni ishga tushirish (shell'siz — argumentlar inyeksiyadan himoyalangan). */
export function run(cmd: string, args: string[], opts: { timeoutMs?: number; cwd?: string; onLine?: (line: string) => void } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error(`${cmd} vaqt limitidan oshdi (${Math.round(opts.timeoutMs! / 60000)} daq)`));
        }, opts.timeoutMs)
      : null;
    const onData = (buf: Buffer, which: "out" | "err") => {
      const s = buf.toString();
      if (which === "out") stdout += s;
      else stderr += s;
      if (stdout.length > 1e6) stdout = stdout.slice(-5e5);
      if (stderr.length > 1e6) stderr = stderr.slice(-5e5);
      if (opts.onLine) for (const line of s.split(/\r?\n/)) if (line.trim()) opts.onLine(line);
    };
    child.stdout.on("data", (b) => onData(b, "out"));
    child.stderr.on("data", (b) => onData(b, "err"));
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      reject(new Error(`${cmd} ishga tushmadi: ${e.message}. O'rnatilganini va PATH'da ekanini tekshiring.`));
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}
