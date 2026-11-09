import { describe, expect, it } from "vitest";

import { bucketKeys, resolveWindows } from "./insights.period.ts";

const now = new Date("2026-03-15T12:00:00.000Z");

describe("resolveWindows", () => {
  it("compares a period with the previous one of the same length", () => {
    const { current, previous, unit } = resolveWindows("7d", now);

    expect(current.from?.toISOString()).toBe("2026-03-08T12:00:00.000Z");
    expect(previous?.from?.toISOString()).toBe("2026-03-01T12:00:00.000Z");
    expect(previous?.to).toEqual(current.from);
    expect(unit).toBe("day");
  });

  it("has no previous window and uses months for all time", () => {
    const windows = resolveWindows("all", now);

    expect(windows.current.from).toBeNull();
    expect(windows.previous).toBeNull();
    expect(windows.unit).toBe("month");
  });

  it("picks the bucket from the span", () => {
    expect(resolveWindows("30d", now).unit).toBe("day");
    expect(resolveWindows("90d", now).unit).toBe("week");
    expect(resolveWindows("12m", now).unit).toBe("month");
  });
});

describe("bucketKeys", () => {
  it("lists every day including the last one", () => {
    expect(bucketKeys(new Date("2026-03-13T20:00:00Z"), now, "day")).toEqual([
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
  });

  it("starts weeks on Monday", () => {
    expect(bucketKeys(new Date("2026-03-04T00:00:00Z"), now, "week")).toEqual([
      "2026-03-02",
      "2026-03-09",
    ]);
  });

  it("steps through months", () => {
    expect(bucketKeys(new Date("2025-12-20T00:00:00Z"), now, "month")).toEqual([
      "2025-12-01",
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
    ]);
  });
});
