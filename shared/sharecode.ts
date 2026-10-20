// CS2/CS:GO match sharing code (CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx) dekoderi.
// Kod 18 baytli sonni base57 da ifodalaydi: matchId (u64 LE), outcomeId (u64 LE), token (u16 LE).
const DICTIONARY = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789";
const BASE = BigInt(DICTIONARY.length);

export const SHARE_CODE_RE = /^CSGO(-[ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789]{5}){5}$/;

export interface DecodedShareCode {
  matchId: string;
  outcomeId: string;
  token: number;
}

export function isValidShareCode(code: string): boolean {
  return SHARE_CODE_RE.test(code.trim());
}

function readLE(bytes: number[]): bigint {
  let v = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}

export function decodeShareCode(code: string): DecodedShareCode {
  const trimmed = code.trim();
  if (!isValidShareCode(trimmed)) throw new Error("Noto'g'ri share code formati");
  const chars = trimmed.replace(/^CSGO-/, "").replace(/-/g, "").split("").reverse();
  let big = 0n;
  for (const c of chars) big = big * BASE + BigInt(DICTIONARY.indexOf(c));
  const bytes: number[] = new Array(18).fill(0);
  for (let i = 17; i >= 0; i--) {
    bytes[i] = Number(big & 0xffn);
    big >>= 8n;
  }
  if (big !== 0n) throw new Error("Share code juda katta");
  return {
    matchId: readLE(bytes.slice(0, 8)).toString(),
    outcomeId: readLE(bytes.slice(8, 16)).toString(),
    token: Number(readLE(bytes.slice(16, 18))),
  };
}

export function encodeShareCode({ matchId, outcomeId, token }: DecodedShareCode): string {
  const bytes: number[] = [];
  const pushLE = (v: bigint, n: number) => {
    for (let i = 0; i < n; i++) {
      bytes.push(Number(v & 0xffn));
      v >>= 8n;
    }
  };
  pushLE(BigInt(matchId), 8);
  pushLE(BigInt(outcomeId), 8);
  pushLE(BigInt(token), 2);
  let big = 0n;
  for (const b of bytes) big = (big << 8n) | BigInt(b);
  let out = "";
  for (let i = 0; i < 25; i++) {
    out += DICTIONARY[Number(big % BASE)];
    big /= BASE;
  }
  return `CSGO-${out.slice(0, 5)}-${out.slice(5, 10)}-${out.slice(10, 15)}-${out.slice(15, 20)}-${out.slice(20)}`;
}
