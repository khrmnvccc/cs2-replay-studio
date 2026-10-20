import { describe, expect, it } from "vitest";
import { decodeShareCode, encodeShareCode, isValidShareCode } from "@shared/sharecode";
import { accountIdToSteamId64, steamId64ToAccountId, AUTH_CODE_RE } from "@shared/steamid";

describe("share code", () => {
  // node-csgo / globaloffensive-sharecode hujjatidagi ma'lum vektor
  it("ma'lum share code'ni to'g'ri dekodlaydi", () => {
    expect(decodeShareCode("CSGO-vGqmL-vb2x2-nTQtU-e9dco-qWHzN")).toEqual({
      matchId: "3354591898827227340",
      outcomeId: "3354598500191961136",
      token: 7780,
    });
  });
  it("encode/decode aylanma", () => {
    const d = { matchId: "3517003298387886230", outcomeId: "3517006815366922437", token: 12345 };
    const code = encodeShareCode(d);
    expect(isValidShareCode(code)).toBe(true);
    expect(decodeShareCode(code)).toEqual(d);
  });
  it("noto'g'ri formatni rad etadi", () => {
    expect(isValidShareCode("CSGO-abc")).toBe(false);
    expect(isValidShareCode("CSGO-vGqmL-vb2x2-nTQtU-e9dco-qWHz0")).toBe(false); // 0 lug'atda yo'q
    expect(() => decodeShareCode("hello")).toThrow();
  });
});

describe("steamid", () => {
  it("account id <-> steamid64", () => {
    expect(accountIdToSteamId64(22202)).toBe("76561197960287930");
    expect(steamId64ToAccountId("76561197960287930")).toBe(22202);
  });
  it("auth code formati", () => {
    expect(AUTH_CODE_RE.test("AB12-CDE34-FG56")).toBe(true);
    expect(AUTH_CODE_RE.test("ab12-cde34-fg56")).toBe(false);
  });
});
