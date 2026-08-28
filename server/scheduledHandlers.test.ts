import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authenticateRequest: vi.fn(), startScheduleRun: vi.fn(), completeScheduleRun: vi.fn(), failScheduleRun: vi.fn(), runWeeklyResearch: vi.fn(), notifyDueOpportunities: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: state.authenticateRequest } }));
vi.mock("./monitoringDb", () => ({
  startScheduleRun: state.startScheduleRun, completeScheduleRun: state.completeScheduleRun, failScheduleRun: state.failScheduleRun, runWeeklyResearch: state.runWeeklyResearch, notifyDueOpportunities: state.notifyDueOpportunities,
}));

const { dueActionHandler, weeklyResearchHandler } = await import("./scheduledHandlers");

function response() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { json, status };
}

const payload = {
  report: { title: "排程回寫驗證週報", periodStart: "2026-08-24T00:00:00.000Z", periodEnd: "2026-08-30T00:00:00.000Z", summary: "已驗證資料回寫。", content: "這是排程處理器測試資料。", status: "published" },
  findings: [{ company: { name: "排程測試企業", supplyChainStage: "midstream", region: "新竹", status: "review", priority: "low", score: 20 }, sources: [{ sourceType: "government", quality: "primary", title: "測試公開來源", url: "https://example.com/official", excerpt: "用於路由測試。" }] }],
};

describe("scheduled handlers", () => {
  beforeEach(() => { vi.clearAllMocks(); state.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "weekly-task" }); state.startScheduleRun.mockResolvedValue(9); state.completeScheduleRun.mockResolvedValue(undefined); });

  it("以 cron 身份驗證週報 payload、寫回資料並完成執行紀錄", async () => {
    state.runWeeklyResearch.mockResolvedValue({ ok: true, reportId: 7, sourceCount: 1, opportunityCount: 1 });
    const res = response();
    await weeklyResearchHandler({ body: payload, originalUrl: "/api/scheduled/weekly-research" } as any, res as any);
    expect(state.startScheduleRun).toHaveBeenCalledWith("weekly_research", "weekly-task");
    expect(state.runWeeklyResearch).toHaveBeenCalledWith("weekly-task", expect.objectContaining({ findings: expect.any(Array) }));
    expect(state.completeScheduleRun).toHaveBeenCalledWith(9, expect.objectContaining({ status: "success", reportId: 7, sourceCount: 1, opportunityCount: 1 }));
    expect(res.json).toHaveBeenCalledWith({ ok: true, reportId: 7, sourceCount: 1, opportunityCount: 1 });
  });

  it("記錄研究寫回失敗並回傳可追查的伺服器錯誤", async () => {
    state.runWeeklyResearch.mockRejectedValue(new Error("資料庫暫時不可用"));
    const res = response();
    await weeklyResearchHandler({ body: payload, originalUrl: "/api/scheduled/weekly-research" } as any, res as any);
    expect(state.failScheduleRun).toHaveBeenCalledWith(9, "資料庫暫時不可用");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("記錄每日到期提醒的跳過結果", async () => {
    state.notifyDueOpportunities.mockResolvedValue({ ok: true, skipped: "schedule_disabled" });
    const res = response();
    await dueActionHandler({ body: {}, originalUrl: "/api/scheduled/due-actions" } as any, res as any);
    expect(state.startScheduleRun).toHaveBeenCalledWith("due_actions", "weekly-task");
    expect(state.completeScheduleRun).toHaveBeenCalledWith(9, expect.objectContaining({ status: "skipped", message: "schedule_disabled" }));
    expect(res.json).toHaveBeenCalledWith({ ok: true, skipped: "schedule_disabled" });
  });
});
