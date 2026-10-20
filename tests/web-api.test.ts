import { describe, expect, it, vi } from "vitest";
import { getNextMatchSharingCode, getPlayerSummary } from "@/lib/steam/web-api";

const f = (status: number, body: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("Steam Web API", () => {
  it("GetNextMatchSharingCode holatlari", async () => {
    const args = ["key", "76561198000000001", "AAAA-BBBBB-CCCC", "CSGO-x"] as const;
    expect(await getNextMatchSharingCode(...args, f(200, { result: { nextcode: "CSGO-aaaaa-bbbbb-ccccc-ddddd-eeeee" } }) as never)).toEqual({ kind: "next", code: "CSGO-aaaaa-bbbbb-ccccc-ddddd-eeeee" });
    expect(await getNextMatchSharingCode(...args, f(202, { result: { nextcode: "n/a" } }) as never)).toEqual({ kind: "none" });
    expect(await getNextMatchSharingCode(...args, f(200, { result: { nextcode: "n/a" } }) as never)).toEqual({ kind: "none" });
    expect(await getNextMatchSharingCode(...args, f(403) as never)).toEqual({ kind: "invalid_auth" });
    expect(await getNextMatchSharingCode(...args, f(412) as never)).toEqual({ kind: "invalid_known_code" });
  });

  it("429 da qayta urinadi", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => (++n < 2 ? new Response("", { status: 429 }) : new Response(JSON.stringify({ result: { nextcode: "n/a" } }), { status: 202 })));
    expect(await getNextMatchSharingCode("k", "76561198000000001", "A", "B", fetchImpl as never)).toEqual({ kind: "none" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("GetPlayerSummaries profilni o'qiydi", async () => {
    const p = await getPlayerSummary(
      "k",
      "76561198000000001",
      f(200, { response: { players: [{ steamid: "76561198000000001", personaname: "s1mple", avatarfull: "https://avatars.steamstatic.com/x_full.jpg", profileurl: "https://steamcommunity.com/id/x/" }] } }) as never,
    );
    expect(p.personaName).toBe("s1mple");
    expect(p.avatarUrl).toContain("_full");
  });

  it("boshqa SteamID qaytsa rad etadi", async () => {
    await expect(getPlayerSummary("k", "76561198000000001", f(200, { response: { players: [{ steamid: "76561198000000009" }] } }) as never)).rejects.toThrow();
  });
});
