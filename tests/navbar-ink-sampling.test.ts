import { describe, expect, it } from "vitest";
import { inkFromHexColor, inkFromLuminance } from "@/lib/navbar-ink-sampling";

describe("navbar ink sampling", () => {
  it("uses light ink on dark hero regions", () => {
    expect(inkFromLuminance(0.18)).toBe("light");
    expect(inkFromHexColor("#182828")).toBe("light");
  });

  it("uses dark ink on bright hero regions", () => {
    expect(inkFromLuminance(0.82)).toBe("dark");
    expect(inkFromHexColor("#f8f8f8")).toBe("dark");
  });
});
