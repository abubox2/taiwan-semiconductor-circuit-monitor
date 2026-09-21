import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.hoisted(() => ({
  getDashboardSnapshot: vi.fn(), getMapLocations: vi.fn(), listCompanies: vi.fn(), createCompany: vi.fn(), updateCompany: vi.fn(), createFacility: vi.fn(), updateFacility: vi.fn(), createRequirement: vi.fn(), updateRequirement: vi.fn(), createOpportunity: vi.fn(), updateOpportunity: vi.fn(), createSource: vi.fn(), updateSource: vi.fn(), createContact: vi.fn(), updateContact: vi.fn(), createContactLog: vi.fn(), updateContactLog: vi.fn(), createReport: vi.fn(), updateReport: vi.fn(), geocodeFacility: vi.fn(), listCustomNotificationRules: vi.fn(), createCustomNotificationRule: vi.fn(), updateCustomNotificationRule: vi.fn(), deleteCustomNotificationRule: vi.fn(),
}));

vi.mock("./monitoringDb", () => mockedDb);
const { appRouter } = await import("./routers");

function context(): TrpcContext {
  return {
    user: { id: 1, openId: "admin", name: "Admin", email: "admin@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("monitor router", () => {
  it("將核心實體的建立與更新輸入轉交資料服務", async () => {
    Object.values(mockedDb).forEach(mock => mock.mockResolvedValue({ id: 1 }));
    const monitor = appRouter.createCaller(context()).monitor;
    const company = { name: "測試公司", supplyChainStage: "upstream" as const, region: "新竹", status: "review" as const, priority: "high" as const, score: 72 };
    const facility = { companyId: 1, name: "測試廠區", facilityType: "fab" as const, region: "新竹", city: "新竹市", operationalStatus: "planning" as const };
    const requirement = { facilityId: 1, requirementType: "dci" as const, scale: "site" as const, confidence: "review" as const };
    const opportunity = { companyId: 1, title: "測試商機", stage: "discovery" as const, priority: "high" as const, score: 70 };
    const source = { companyId: 1, sourceType: "company" as const, quality: "primary" as const, title: "測試公告", url: "https://example.com/source" };
    const contact = { companyId: 1, name: "測試聯絡人", email: "contact@example.com" };
    const contactLog = { companyId: 1, channel: "meeting" as const, contactedAt: new Date("2026-08-24"), summary: "已完成初步訪談。" };
    const report = { title: "測試週報", periodStart: new Date("2026-08-24"), periodEnd: new Date("2026-08-30"), summary: "摘要內容", content: "完整內容", opportunityCount: 1, sourceCount: 1, status: "draft" as const };

    await monitor.createCompany(company); await monitor.updateCompany({ id: 1, data: company });
    await monitor.createFacility(facility); await monitor.updateFacility({ id: 1, data: facility });
    await monitor.createRequirement(requirement); await monitor.updateRequirement({ id: 1, data: requirement });
    await monitor.createOpportunity(opportunity); await monitor.updateOpportunity({ id: 1, data: opportunity });
    await monitor.createSource(source); await monitor.updateSource({ id: 1, data: source });
    await monitor.createContact(contact); await monitor.updateContact({ id: 1, data: contact });
    await monitor.createContactLog(contactLog); await monitor.updateContactLog({ id: 1, data: contactLog });
    await monitor.createReport(report); await monitor.updateReport({ id: 1, data: report });

    expect(mockedDb.createCompany).toHaveBeenCalledWith(company);
    expect(mockedDb.updateFacility).toHaveBeenCalledWith(1, facility);
    expect(mockedDb.createRequirement).toHaveBeenCalledWith(requirement);
    expect(mockedDb.updateOpportunity).toHaveBeenCalledWith(1, opportunity);
    expect(mockedDb.createSource).toHaveBeenCalledWith(source);
    expect(mockedDb.updateContact).toHaveBeenCalledWith(1, contact);
    expect(mockedDb.createContactLog).toHaveBeenCalledWith(contactLog);
    expect(mockedDb.updateReport).toHaveBeenCalledWith(1, report);
  });

  it("在資料服務呼叫前攔截不合法商機輸入", async () => {
    const monitor = appRouter.createCaller(context()).monitor;
    await expect(monitor.createOpportunity({ companyId: 1, title: "無效分數", stage: "discovery", priority: "high", score: 120 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockedDb.createOpportunity).not.toHaveBeenCalledWith(expect.objectContaining({ score: 120 }));
  });

  it("將缺少可核對地址的定位錯誤回傳給操作端", async () => {
    mockedDb.geocodeFacility.mockRejectedValueOnce(new Error("請先填入可核對的據點地址，再進行地圖定位。"));
    const monitor = appRouter.createCaller(context()).monitor;
    await expect(monitor.geocodeFacility({ id: 1 })).rejects.toThrow("請先填入可核對的據點地址");
  });

  it("將供應鏈細分類篩選轉交企業清單查詢", async () => {
    mockedDb.listCompanies.mockResolvedValueOnce([]);
    const monitor = appRouter.createCaller(context()).monitor;
    await monitor.listCompanies({ stage: "upstream", subCategory: "矽晶圓", region: "新竹" });
    expect(mockedDb.listCompanies).toHaveBeenCalledWith({ stage: "upstream", subCategory: "矽晶圓", region: "新竹" });
  });

  it("將首頁儀表板查詢轉交快照資料服務", async () => {
    const snapshot = { stats: { companies: 244 }, distributions: { supplyChain: { upstream: 59, midstream: 147, downstream: 38 } } };
    mockedDb.getDashboardSnapshot.mockResolvedValueOnce(snapshot);
    await expect(appRouter.createCaller(context()).monitor.dashboard()).resolves.toEqual(snapshot);
    expect(mockedDb.getDashboardSnapshot).toHaveBeenCalledOnce();
  });

  it("回傳具有公開座標的廠區位置供地圖與備援清單使用", async () => {
    const locations = [{ id: 2, name: "晶圓十八廠", region: "南部科學園區", city: "台南市", latitude: "23.1163159", longitude: "120.2641416", company: { name: "台灣積體電路製造股份有限公司" }, requirements: [] }];
    mockedDb.getMapLocations.mockResolvedValueOnce(locations);
    await expect(appRouter.createCaller(context()).monitor.mapLocations()).resolves.toEqual(locations);
    expect(mockedDb.getMapLocations).toHaveBeenCalledOnce();
  });

  it("將自訂通知規則的建立、更新與刪除轉交資料服務", async () => {
    const monitor = appRouter.createCaller(context()).monitor;
    const rule = { name: "AI 地端商機", triggerType: "score_threshold" as const, enabled: true, keywords: "企業地端 AI", priority: "high" as const, stage: null, supplyChainStage: "downstream" as const, minScore: 80, dueWithinHours: null, cooldownHours: 24 };
    await monitor.createCustomNotificationRule(rule);
    await monitor.updateCustomNotificationRule({ id: 2, data: rule });
    await monitor.deleteCustomNotificationRule({ id: 2 });
    expect(mockedDb.createCustomNotificationRule).toHaveBeenCalledWith(rule);
    expect(mockedDb.updateCustomNotificationRule).toHaveBeenCalledWith(2, rule);
    expect(mockedDb.deleteCustomNotificationRule).toHaveBeenCalledWith(2);
  });
});
