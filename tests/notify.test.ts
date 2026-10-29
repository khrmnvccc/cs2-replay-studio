import { describe, expect, it } from "vitest";
import { render } from "@shared/notify";

describe("render", () => {
  it("fills variables and drops empty segments", () => {
    expect(render("{map} · {score} · {kills} kill", { map: "Mirage", score: "13:1", kills: 6 })).toBe("Mirage · 13:1 · 6 kill");
    expect(render("{map} · {score}", { map: "Mirage" })).toBe("Mirage");
    expect(render("Salom {name}!", {})).toBe("Salom !");
  });
});
