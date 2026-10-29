// Bot Steam akkauntini bir marta ulash: login + Steam Guard kodi so'raladi, refresh token .env ga yoziladi.
// Parol hech qayerda saqlanmaydi. Ishga tushirish: windows\bot-ulash.bat (yoki: npx tsx src/bot-login.ts)
import fs from "node:fs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Writable } from "node:stream";
import SteamUser from "steam-user";

const ENV = ".env";

function setEnv(lines: string[], key: string, value: string): string[] {
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i >= 0) lines[i] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
  return lines;
}

async function main() {
  if (!fs.existsSync(ENV)) throw new Error(".env topilmadi — avval worker'ni bir marta sozlang");
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) stdout.write(chunk);
      cb();
    },
  });
  const rl = readline.createInterface({ input: stdin, output, terminal: stdin.isTTY });
  console.log("Bot Steam akkaunti (asosiy akkauntingiz EMAS). Parol saqlanmaydi.\n");
  const accountName = (await rl.question("Bot login: ")).trim();
  // Parol ekranda ko'rinmasin (rasmga tushib qolmasligi uchun)
  const asking = rl.question("Bot paroli (yozganingiz ko'rinmaydi, yozib Enter bosing): ");
  muted = true;
  const password = (await asking).trim();
  muted = false;
  stdout.write("\n");

  const client = new SteamUser();
  client.on("steamGuard", async (domain: string | null, callback: (code: string) => void) => {
    const where = domain ? `${domain} pochtasiga kelgan` : "Steam Guard ilovasidagi";
    callback((await rl.question(`${where} kodni kiriting: `)).trim());
  });

  const token = await new Promise<string>((resolve, reject) => {
    client.on("error", (e: Error) => reject(new Error(`Login xatosi: ${e.message}`)));
    client.on("refreshToken", (t: string) => resolve(t));
    client.logOn({ accountName, password });
  });

  // CS2 bepul litsenziyasi bo'lmasa — qo'shamiz (GC uchun kerak)
  await new Promise<void>((resolve) => {
    client.requestFreeLicense([730], () => resolve());
    setTimeout(resolve, 10_000);
  });

  let lines = fs.readFileSync(ENV, "utf8").split(/\r?\n/).filter((l) => l.trim() !== "");
  lines = setEnv(lines, "STEAM_BOT_REFRESH_TOKEN", token);
  const capsLine = lines.find((l) => l.startsWith("WORKER_CAPABILITIES="));
  const caps = new Set((capsLine?.split("=")[1] ?? "parse,zip").split(",").map((s) => s.trim()).filter(Boolean));
  caps.add("gc");
  lines = setEnv(lines, "WORKER_CAPABILITIES", [...caps].join(","));
  fs.writeFileSync(ENV, lines.join("\n") + "\n");

  console.log("\nTayyor! Bot ulandi, .env yangilandi (vazifalar: " + [...caps].join(", ") + ").");
  console.log("Endi worker oynasini yopib, worker-start.bat ni qayta ishga tushiring.");
  client.logOff();
  rl.close();
}

main().catch((e) => {
  console.error("\n" + (e as Error).message);
  process.exit(1);
});
