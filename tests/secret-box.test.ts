import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@shared/secret-box";

describe("AES-256-GCM", () => {
  const key = randomBytes(32).toString("base64");
  it("shifrlaydi va ochadi", () => {
    const c = encryptSecret("ABCD-EFGHI-JKLM", key);
    expect(c).not.toContain("ABCD");
    expect(decryptSecret(c, key)).toBe("ABCD-EFGHI-JKLM");
  });
  it("o'zgartirilgan shifrni rad etadi", () => {
    const c = encryptSecret("secret", key).split(":");
    c[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(c.join(":"), key)).toThrow();
  });
});
