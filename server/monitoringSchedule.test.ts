import { describe, expect, it } from "vitest";
import { taipeiDayStart } from "./monitoringDb";

describe("台灣時區提醒去重", () => {
  it("以 Asia/Taipei 的日界線而非 UTC 午夜判定同一天", () => {
    expect(taipeiDayStart(new Date("2026-08-30T16:30:00.000Z")).toISOString()).toBe("2026-08-30T16:00:00.000Z");
    expect(taipeiDayStart(new Date("2026-08-31T15:59:59.000Z")).toISOString()).toBe("2026-08-30T16:00:00.000Z");
    expect(taipeiDayStart(new Date("2026-08-31T16:00:00.000Z")).toISOString()).toBe("2026-08-31T16:00:00.000Z");
  });
});
