import { describe, expect, it } from "vitest";
import { customNotificationMatches } from "./monitoringDb";
import { fixedNotificationKeywords } from "./monitoringSchemas";

describe("自訂通知規則", () => {
  const now = new Date("2026-09-21T00:00:00.000Z");
  const opportunity = { title: "AI Data Platform 地端建置", priority: "high", stage: "qualified", score: 86, nextAction: "確認自用資料中心網路需求", serviceHypothesis: null, verificationQuestion: null, nextActionDue: new Date("2026-09-21T12:00:00.000Z") } as any;
  const company = { name: "測試半導體企業", supplyChainStage: "midstream", subCategory: "AI 方案商", description: null } as any;
  const baseRule = { enabled: 1, triggerType: "score_threshold", priority: "high", stage: null, supplyChainStage: "midstream", minScore: 80, keywords: "AI Data Platform, 企業地端 AI", dueWithinHours: null, cooldownHours: 24, lastTriggeredAt: null } as any;

  it("符合分數、段別與固定關鍵字條件時觸發", () => {
    expect(customNotificationMatches(baseRule, opportunity, company, "score_threshold", now)).toBe(true);
  });

  it("冷卻時間內不重複觸發", () => {
    expect(customNotificationMatches({ ...baseRule, lastTriggeredAt: new Date("2026-09-20T12:00:00.000Z") }, opportunity, company, "score_threshold", now)).toBe(false);
  });

  it("行動到期規則只接受指定時間窗", () => {
    const rule = { ...baseRule, triggerType: "action_due", keywords: null, dueWithinHours: 24 };
    expect(customNotificationMatches(rule, opportunity, company, "action_due", now)).toBe(true);
    expect(customNotificationMatches(rule, { ...opportunity, nextActionDue: new Date("2026-09-23T00:00:01.000Z") }, company, "action_due", now)).toBe(false);
  });

  it("保留四個固定關鍵字", () => {
    expect(fixedNotificationKeywords).toEqual(["自用資料中心", "舊廠改建", "AI Data Platform", "企業地端 AI"]);
  });
});
