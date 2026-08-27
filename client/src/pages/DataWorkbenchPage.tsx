import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Code2, Database, Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type RecordKind = "company" | "facility" | "requirement" | "opportunity" | "source" | "contact" | "contactLog" | "report";
const kinds: Array<{ id: RecordKind; label: string }> = [
  { id: "company", label: "企業主檔" }, { id: "facility", label: "廠區／機房" }, { id: "requirement", label: "網路需求" }, { id: "opportunity", label: "銷售商機" }, { id: "source", label: "公開來源" }, { id: "contact", label: "聯絡人" }, { id: "contactLog", label: "互動紀錄" }, { id: "report", label: "週報" },
];

function stripRecord(record: Record<string, unknown>) {
  const { id, createdAt, updatedAt, generatedAt, company, facility, requirements, opportunity, logs, ...editable } = record;
  return Object.fromEntries(Object.entries(editable).filter(([, value]) => value !== null && value !== undefined));
}

function recordLabel(kind: RecordKind, record: Record<string, unknown>) {
  if (kind === "company" || kind === "facility" || kind === "contact" || kind === "report") return String(record.name || record.title || "未命名紀錄");
  if (kind === "requirement") return `${String(record.requirementType)} · #${String(record.id)}`;
  if (kind === "opportunity") return String(record.title || "未命名商機");
  if (kind === "source") return String(record.title || "未命名來源");
  return `${String(record.channel || "互動")} · ${String(record.contactedAt || "")}`;
}

export default function DataWorkbenchPage() {
  const utils = trpc.useUtils();
  const [kind, setKind] = useState<RecordKind>("company"); const [selectedId, setSelectedId] = useState<number | null>(null); const [content, setContent] = useState("");
  const companies = trpc.monitor.listCompanies.useQuery(); const facilities = trpc.monitor.listFacilities.useQuery(); const opportunities = trpc.monitor.listOpportunities.useQuery(); const sources = trpc.monitor.listSources.useQuery(); const contacts = trpc.monitor.listContacts.useQuery(); const logs = trpc.monitor.listContactLogs.useQuery(); const reports = trpc.monitor.listReports.useQuery();
  const updateCompany = trpc.monitor.updateCompany.useMutation(); const updateFacility = trpc.monitor.updateFacility.useMutation(); const updateRequirement = trpc.monitor.updateRequirement.useMutation(); const updateOpportunity = trpc.monitor.updateOpportunity.useMutation(); const updateSource = trpc.monitor.updateSource.useMutation(); const updateContact = trpc.monitor.updateContact.useMutation(); const updateContactLog = trpc.monitor.updateContactLog.useMutation(); const updateReport = trpc.monitor.updateReport.useMutation(); const geocodeFacility = trpc.monitor.geocodeFacility.useMutation({ onSuccess: () => { utils.monitor.listFacilities.invalidate(); utils.monitor.mapLocations.invalidate(); toast.success("已依地址更新據點座標"); }, onError: error => toast.error(error.message) });
  const rows = useMemo(() => {
    if (kind === "company") return (companies.data ?? []) as Array<Record<string, unknown>>;
    if (kind === "facility") return (facilities.data ?? []) as Array<Record<string, unknown>>;
    if (kind === "requirement") return (facilities.data ?? []).flatMap(facility => facility.requirements.map(requirement => ({ ...requirement, facilityName: facility.name, companyName: facility.company?.name }))) as Array<Record<string, unknown>>;
    if (kind === "opportunity") return (opportunities.data ?? []) as Array<Record<string, unknown>>;
    if (kind === "source") return (sources.data ?? []) as Array<Record<string, unknown>>;
    if (kind === "contact") return (contacts.data ?? []) as Array<Record<string, unknown>>;
    if (kind === "contactLog") return (logs.data ?? []) as Array<Record<string, unknown>>;
    return (reports.data ?? []) as Array<Record<string, unknown>>;
  }, [companies.data, contacts.data, facilities.data, kind, logs.data, opportunities.data, reports.data, sources.data]);
  const selected = useMemo(() => rows.find(row => row.id === selectedId) ?? null, [rows, selectedId]);
  useEffect(() => { setSelectedId(rows[0]?.id ? Number(rows[0].id) : null); }, [kind, rows]);
  useEffect(() => { if (selected) setContent(JSON.stringify(stripRecord(selected), null, 2)); else setContent(""); }, [selected]);
  const loading = companies.isLoading || facilities.isLoading || opportunities.isLoading || sources.isLoading || contacts.isLoading || logs.isLoading || reports.isLoading;
  const saving = updateCompany.isPending || updateFacility.isPending || updateRequirement.isPending || updateOpportunity.isPending || updateSource.isPending || updateContact.isPending || updateContactLog.isPending || updateReport.isPending;
  async function save() {
    if (!selectedId) return;
    let data: Record<string, unknown>;
    try { data = JSON.parse(content) as Record<string, unknown>; } catch { toast.error("編輯內容不是合法 JSON，請檢查引號、逗號與括號。"); return; }
    const input = { id: selectedId, data } as never;
    const success = () => { utils.monitor.listCompanies.invalidate(); utils.monitor.listFacilities.invalidate(); utils.monitor.listOpportunities.invalidate(); utils.monitor.listSources.invalidate(); utils.monitor.listContacts.invalidate(); utils.monitor.listContactLogs.invalidate(); utils.monitor.listReports.invalidate(); utils.monitor.dashboard.invalidate(); toast.success("紀錄已更新"); };
    const failure = (error: { message: string }) => toast.error(error.message);
    if (kind === "company") updateCompany.mutate(input, { onSuccess: success, onError: failure });
    else if (kind === "facility") updateFacility.mutate(input, { onSuccess: success, onError: failure });
    else if (kind === "requirement") updateRequirement.mutate(input, { onSuccess: success, onError: failure });
    else if (kind === "opportunity") updateOpportunity.mutate(input, { onSuccess: success, onError: failure });
    else if (kind === "source") updateSource.mutate(input, { onSuccess: success, onError: failure });
    else if (kind === "contact") updateContact.mutate(input, { onSuccess: success, onError: failure });
    else if (kind === "contactLog") updateContactLog.mutate(input, { onSuccess: success, onError: failure });
    else updateReport.mutate(input, { onSuccess: success, onError: failure });
  }
  return <div className="mx-auto max-w-[1500px]"><header className="mb-6 border-b border-cyan-100/10 pb-6"><p className="text-[11px] font-semibold tracking-[0.2em] text-orange-200/80">DATA GOVERNANCE WORKBENCH</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">資料更新工作台</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">為進階管理者提供所有核心實體的完整編修入口。儲存前由伺服器依資料契約重新驗證，避免未授權或格式錯誤的資料寫入。</p></header><div className="glass-panel rounded-2xl p-3"><div className="flex gap-2 overflow-x-auto pb-1">{kinds.map(item => <button key={item.id} onClick={() => setKind(item.id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs ${kind === item.id ? "bg-orange-300 text-[#09201e]" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>{item.label}</button>)}</div></div>{loading ? <div className="grid min-h-[45vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-100"/></div> : <div className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]"><aside className="glass-panel overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div><p className="text-sm font-semibold text-white">可編修紀錄</p><p className="mt-1 text-xs text-white/40">{rows.length} 筆</p></div><Database className="h-4 w-4 text-cyan-100"/></div><div className="max-h-[570px] overflow-y-auto p-2">{rows.length ? rows.map(row => <button onClick={() => setSelectedId(Number(row.id))} key={String(row.id)} className={`mb-1 w-full rounded-xl p-3 text-left ${selectedId === row.id ? "bg-cyan-100/12" : "hover:bg-white/[0.045]"}`}><p className="truncate text-sm font-medium text-white">{recordLabel(kind, row)}</p><p className="mt-1 truncate text-xs text-white/42">ID #{String(row.id)}</p></button>) : <p className="p-6 text-center text-sm leading-6 text-white/42">尚無可編修紀錄。</p>}</div></aside><section className="glass-panel rounded-2xl p-5 sm:p-6">{selected ? <><div className="flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-100/10 text-cyan-100"><Code2 className="h-4 w-4"/></div><div><p className="text-sm font-semibold text-white">{recordLabel(kind, selected)}</p><p className="mt-0.5 text-xs text-white/42">編修後將依 {kinds.find(item => item.id === kind)?.label} 資料契約驗證</p></div></div><div className="flex gap-2">{kind === "facility" && <Button variant="outline" onClick={() => selectedId && geocodeFacility.mutate({ id: selectedId })} disabled={geocodeFacility.isPending} className="rounded-xl border-cyan-100/20 bg-cyan-100/7 text-cyan-50 hover:bg-cyan-100/14 hover:text-white"><MapPin className="mr-1.5 h-4 w-4"/>{geocodeFacility.isPending ? "定位中" : "依地址定位"}</Button>}<Button onClick={save} disabled={saving} className="rounded-xl bg-orange-300 text-[#08211e] hover:bg-orange-200"><Save className="mr-1.5 h-4 w-4"/>{saving ? "儲存中" : "驗證並儲存"}</Button></div></div><textarea value={content} onChange={event => setContent(event.target.value)} spellCheck={false} className="mt-5 min-h-[470px] w-full rounded-xl border border-cyan-100/13 bg-[#041514]/65 p-4 font-mono text-xs leading-6 text-cyan-50 outline-none focus:border-orange-200/55"/><div className="mt-4 flex gap-2 rounded-xl border border-cyan-100/10 bg-cyan-100/[0.045] px-3 py-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100"/><p className="text-xs leading-5 text-white/52">此工作台適合批次或完整欄位調整；若要新增資料，請使用各業務頁面的新增表單。日期請使用 ISO 8601 格式；空白可刪除欄位或填入空字串。選取廠區時，先儲存可核對地址，再使用「依地址定位」。</p></div></> : <div className="grid min-h-[520px] place-items-center text-center"><p className="text-sm text-white/45">請從左側選擇一筆紀錄。</p></div>}</section></div>}</div>;
}
