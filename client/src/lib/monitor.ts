export const supplyChainLabels: Record<string, string> = { upstream: "上游材料／設備", midstream: "中游製造／封測", downstream: "下游系統／應用" };
export const priorityLabels: Record<string, string> = { critical: "關鍵", high: "高", medium: "中", low: "低" };
export const stageLabels: Record<string, string> = { discovery: "線索發現", qualified: "需求確認", solution: "方案規劃", proposal: "提案報價", negotiation: "商務洽談", won: "已成交", lost: "暫停／失單" };
export const facilityLabels: Record<string, string> = { fab: "晶圓廠", datacenter: "機房／資料中心", office: "辦公據點", rd: "研發中心", warehouse: "倉儲／物流", other: "其他" };
export const requirementLabels: Record<string, string> = { leased_line: "企業專線", dia: "DIA 網際網路", dci: "資料中心互連", cloud_connect: "雲端直連", iepl_iplc: "IEPL／IPLC", backup: "備援與異地複寫", network_equipment: "網通設備", other: "其他" };

export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatCurrency(value?: number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(value);
}

export function priorityClass(priority?: string | null) {
  return priority === "critical" ? "bg-orange-400/16 text-orange-200 border-orange-300/30" : priority === "high" ? "bg-amber-300/13 text-amber-100 border-amber-300/25" : priority === "medium" ? "bg-cyan-300/10 text-cyan-100 border-cyan-200/20" : "bg-white/5 text-white/60 border-white/10";
}
