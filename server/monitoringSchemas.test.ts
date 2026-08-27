import { describe, expect, it } from "vitest";
import { companyInputSchema, defaultWeeklySchedule, weeklyResearchPayloadSchema } from "./monitoringSchemas";

describe("半導體商機監控資料契約", () => {
  it("保留每週一台灣時間上午九點的預設研究排程", () => {
    expect(defaultWeeklySchedule).toEqual({
      timezone: "Asia/Taipei",
      weeklyCron: "0 0 1 * * 0",
      display: "每週一 09:00（台灣時間）",
    });
  });

  it("接受具有公開來源的待覆核商機研究資料", () => {
    const result = weeklyResearchPayloadSchema.parse({
      report: {
        title: "2026 年第 35 週商機週報",
        periodStart: "2026-08-24T00:00:00.000Z",
        periodEnd: "2026-08-30T00:00:00.000Z",
        summary: "測試週報摘要。",
        content: "測試週報完整內容。",
      },
      findings: [{
        company: {
          name: "測試半導體公司",
          supplyChainStage: "midstream",
          region: "新竹",
          status: "review",
          priority: "high",
          score: 70,
        },
        sources: [{
          sourceType: "company",
          quality: "primary",
          title: "測試官方公告",
          url: "https://example.com/official-announcement",
          excerpt: "用於驗證公開來源必要性。",
        }],
      }],
    });
    expect(result.findings[0]?.sources[0]?.quality).toBe("primary");
    expect(result.report.status).toBe("published");
  });

  it("拒絕沒有公開來源的研究發現", () => {
    const result = weeklyResearchPayloadSchema.safeParse({
      report: { title: "不完整週報", periodStart: "2026-08-24", periodEnd: "2026-08-30", summary: "摘要", content: "內容" },
      findings: [{
        company: { name: "未佐證企業", supplyChainStage: "upstream", region: "台中", status: "nurture", priority: "low", score: 20 },
        sources: [],
      }],
    });
    expect(result.success).toBe(false);
  });

  it("限制企業評分介於零至一百分", () => {
    expect(() => companyInputSchema.parse({ name: "評分測試企業", supplyChainStage: "downstream", region: "台北", status: "review", priority: "medium", score: 101 })).toThrow();
  });
});
