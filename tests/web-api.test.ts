import { describe, expect, it, vi } from "vitest";
import { getNextMatchSharingCode, getPlayerSummary, getProfile, getPublicProfile } from "@/lib/steam/web-api";

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

describe("getPublicProfile / getProfile", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><profile><steamID64>76561198000000001</steamID64><steamID><![CDATA[s1mple fan]]></steamID><avatarFull><![CDATA[https://avatars.steamstatic.com/abc_full.jpg]]></avatarFull><customURL><![CDATA[fan]]></customURL></profile>`;
  const text = (status: number, body: string) => async () => new Response(body, { status });

  it("ochiq profil XML'dan nik va avatarni oladi", async () => {
    const p = await getPublicProfile("76561198000000001", text(200, xml) as never);
    expect(p).toMatchObject({ personaName: "s1mple fan", avatarUrl: "https://avatars.steamstatic.com/abc_full.jpg", profileUrl: "https://steamcommunity.com/id/fan/" });
  });

  it("boshqa steamid qaytsa rad etadi", async () => {
    await expect(getPublicProfile("76561198000000002", text(200, xml) as never)).rejects.toThrow();
  });

  it("kalit bo'lmasa XML yo'lidan foydalanadi", async () => {
    const calls: string[] = [];
    const f = async (u: string) => (calls.push(u), new Response(xml, { status: 200 }));
    const p = await getProfile(undefined, "76561198000000001", f as never);
    expect(p.personaName).toBe("s1mple fan");
    expect(calls[0]).toContain("steamcommunity.com/profiles/76561198000000001/?xml=1");
  });
});
