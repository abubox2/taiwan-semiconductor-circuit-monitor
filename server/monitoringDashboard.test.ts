import { describe, expect, it } from "vitest";
import { buildDashboardSnapshot, countSupplyChainDistribution, filterCompanyRows } from "./monitoringDb";

describe("儀表板供應鏈分布", () => {
  it("依企業主檔逐筆計算上游、中游與下游，不遺漏任何分類", () => {
    const distribution = countSupplyChainDistribution([
      { supplyChainStage: "upstream" }, { supplyChainStage: "midstream" }, { supplyChainStage: "midstream" }, { supplyChainStage: "downstream" },
    ]);
    expect(distribution).toEqual({ upstream: 1, midstream: 2, downstream: 1 });
    expect(Object.values(distribution).reduce((sum, value) => sum + value, 0)).toBe(4);
  });

  it("在尚無某供應鏈分類時不憑空產生統計值", () => {
    expect(countSupplyChainDistribution([{ supplyChainStage: "midstream" }])).toEqual({ midstream: 1 });
  });

  it("使企業名錄與儀表板快照共用同一批 244 家企業的統計基準", () => {
    const companies = [
      ...Array.from({ length: 59 }, (_, id) => ({ id: id + 1, name: `上游 ${id}`, region: "新竹", city: null, subCategory: "設備", ticker: `U${id}`, description: null, supplyChainStage: "upstream" })),
      ...Array.from({ length: 147 }, (_, id) => ({ id: id + 60, name: `中游 ${id}`, region: "新竹", city: null, subCategory: "IC 設計", ticker: `M${id}`, description: null, supplyChainStage: "midstream" })),
      ...Array.from({ length: 38 }, (_, id) => ({ id: id + 207, name: `下游 ${id}`, region: "台北", city: null, subCategory: "系統應用", ticker: `D${id}`, description: null, supplyChainStage: "downstream" })),
    ];
    const snapshot = buildDashboardSnapshot({ companyRows: companies, facilityRows: [], opportunityRows: [], sourceRows: [], reportRows: [], notifications: [] });
    expect(filterCompanyRows(companies)).toHaveLength(snapshot.stats.companies);
    expect(snapshot.stats.companies).toBe(244);
    expect(snapshot.distributions.supplyChain).toEqual({ upstream: 59, midstream: 147, downstream: 38 });
  });
});
