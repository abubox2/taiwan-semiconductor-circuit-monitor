import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  companies,
  customNotificationRules,
  contacts,
  contactLogs,
  evidenceSources,
  facilities,
  monitorSettings,
  networkRequirements,
  notificationLogs,
  opportunities,
  scheduleRuns,
  weeklyReports,
} from "../drizzle/schema";
import { getDb } from "./db";
import { makeRequest, type GeocodingResult } from "./_core/map";
import type {
  companyInputSchema,
  contactInputSchema,
  contactLogInputSchema,
  facilityInputSchema,
  opportunityInputSchema,
  reportInputSchema,
  requirementInputSchema,
  sourceInputSchema,
  weeklyResearchPayloadSchema,
  customNotificationRuleInputSchema,
} from "./monitoringSchemas";
import type { z } from "zod";
import { notifyOwner } from "./_core/notification";

type CompanyInput = z.infer<typeof companyInputSchema>;
type FacilityInput = z.infer<typeof facilityInputSchema>;
type RequirementInput = z.infer<typeof requirementInputSchema>;
type OpportunityInput = z.infer<typeof opportunityInputSchema>;
type SourceInput = z.infer<typeof sourceInputSchema>;
type ContactInput = z.infer<typeof contactInputSchema>;
type ContactLogInput = z.infer<typeof contactLogInputSchema>;
type ReportInput = z.infer<typeof reportInputSchema>;
type WeeklyResearchPayload = z.infer<typeof weeklyResearchPayloadSchema>;
type CustomNotificationRuleInput = z.infer<typeof customNotificationRuleInputSchema>;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法連線，請稍後再試。");
  return db;
}

function emptyToNull(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

export function taipeiDayStart(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00+08:00`);
}

export function countSupplyChainDistribution(rows: Array<{ supplyChainStage: string }>) {
  return rows.reduce<Record<string, number>>((distribution, row) => {
    distribution[row.supplyChainStage] = (distribution[row.supplyChainStage] ?? 0) + 1;
    return distribution;
  }, {});
}

export function filterCompanyRows<T extends { name: string; region: string; city: string | null; subCategory: string | null; ticker: string | null; description: string | null; supplyChainStage: string }>(rows: T[], filters?: { search?: string; stage?: string; subCategory?: string; region?: string }) {
  const search = filters?.search?.trim().toLowerCase();
  return rows.filter(row => {
    const matchesSearch = !search || [row.name, row.region, row.city, row.subCategory, row.ticker, row.description].filter(Boolean).join(" ").toLowerCase().includes(search);
    const matchesStage = !filters?.stage || row.supplyChainStage === filters.stage;
    const matchesSubCategory = !filters?.subCategory || row.subCategory === filters.subCategory;
    const matchesRegion = !filters?.region || row.region === filters.region;
    return matchesSearch && matchesStage && matchesSubCategory && matchesRegion;
  });
}

export async function listCompanies(filters?: { search?: string; stage?: string; subCategory?: string; region?: string }) {
  const db = await requireDb();
  const rows = await db.select().from(companies).orderBy(desc(companies.updatedAt));
  return filterCompanyRows(rows, filters);
}

export async function createCompany(input: CompanyInput) {
  const db = await requireDb();
  const result = await db.insert(companies).values({
    ...input,
    city: emptyToNull(input.city),
    website: emptyToNull(input.website),
    description: emptyToNull(input.description),
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(companies).where(eq(companies.id, id)).limit(1))[0];
}

export async function updateCompany(id: number, input: CompanyInput) {
  const db = await requireDb();
  await db.update(companies).set({
    ...input,
    city: emptyToNull(input.city),
    website: emptyToNull(input.website),
    description: emptyToNull(input.description),
  }).where(eq(companies.id, id));
  return (await db.select().from(companies).where(eq(companies.id, id)).limit(1))[0];
}

export async function listFacilities() {
  const db = await requireDb();
  const [facilityRows, companyRows, requirementRows] = await Promise.all([
    db.select().from(facilities).orderBy(desc(facilities.updatedAt)),
    db.select().from(companies),
    db.select().from(networkRequirements).orderBy(desc(networkRequirements.updatedAt)),
  ]);
  const companyById = new Map(companyRows.map(row => [row.id, row]));
  const requirementsByFacility = new Map<number, typeof requirementRows>();
  requirementRows.forEach(requirement => requirementsByFacility.set(requirement.facilityId, [...(requirementsByFacility.get(requirement.facilityId) ?? []), requirement]));
  return facilityRows.map(facility => ({ ...facility, company: companyById.get(facility.companyId) ?? null, requirements: requirementsByFacility.get(facility.id) ?? [] }));
}

export async function createFacility(input: FacilityInput) {
  const db = await requireDb();
  const result = await db.insert(facilities).values({
    ...input,
    address: emptyToNull(input.address),
    latitude: emptyToNull(input.latitude),
    longitude: emptyToNull(input.longitude),
    notes: emptyToNull(input.notes),
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(facilities).where(eq(facilities.id, id)).limit(1))[0];
}

export async function createRequirement(input: RequirementInput) {
  const db = await requireDb();
  const result = await db.insert(networkRequirements).values({
    ...input,
    bandwidth: emptyToNull(input.bandwidth),
    equipment: emptyToNull(input.equipment),
    estimatedTiming: emptyToNull(input.estimatedTiming),
    notes: emptyToNull(input.notes),
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(networkRequirements).where(eq(networkRequirements.id, id)).limit(1))[0];
}

export async function listOpportunities(filters?: { stage?: string; priority?: string; companyId?: number }) {
  const db = await requireDb();
  const [opportunityRows, companyRows, facilityRows] = await Promise.all([
    db.select().from(opportunities).orderBy(desc(opportunities.updatedAt)),
    db.select().from(companies),
    db.select().from(facilities),
  ]);
  const companyById = new Map(companyRows.map(row => [row.id, row]));
  const facilityById = new Map(facilityRows.map(row => [row.id, row]));
  return opportunityRows.filter(row => (!filters?.stage || row.stage === filters.stage) && (!filters?.priority || row.priority === filters.priority) && (!filters?.companyId || row.companyId === filters.companyId))
    .map(opportunity => ({ ...opportunity, company: companyById.get(opportunity.companyId) ?? null, facility: opportunity.facilityId ? facilityById.get(opportunity.facilityId) ?? null : null }));
}

export async function createOpportunity(input: OpportunityInput) {
  const db = await requireDb();
  const result = await db.insert(opportunities).values({
    ...input,
    facilityId: input.facilityId ?? null,
    owner: emptyToNull(input.owner),
    nextAction: emptyToNull(input.nextAction),
    nextActionDue: input.nextActionDue ?? null,
    serviceHypothesis: emptyToNull(input.serviceHypothesis),
    verificationQuestion: emptyToNull(input.verificationQuestion),
  });
  const id = Number(result[0].insertId);
  const created = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
  if (created && ["critical", "high"].includes(created.priority)) {
    await recordPriorityNotification(created, "priority_created", `新增${created.priority === "critical" ? "關鍵" : "高優先"}商機：${created.title}`);
  }
  if (created) {
    await evaluateCustomNotificationRules(created.id, "opportunity_created");
    await evaluateCustomNotificationRules(created.id, "score_threshold");
  }
  return created;
}

export async function updateOpportunity(id: number, input: OpportunityInput) {
  const db = await requireDb();
  const previous = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
  await db.update(opportunities).set({
    ...input,
    facilityId: input.facilityId ?? null,
    owner: emptyToNull(input.owner),
    nextAction: emptyToNull(input.nextAction),
    nextActionDue: input.nextActionDue ?? null,
    serviceHypothesis: emptyToNull(input.serviceHypothesis),
    verificationQuestion: emptyToNull(input.verificationQuestion),
  }).where(eq(opportunities.id, id));
  const updated = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
  if (updated && previous && previous.stage !== updated.stage && ["critical", "high"].includes(updated.priority)) {
    await recordPriorityNotification(updated, "stage_changed", `高優先商機階段變更：${updated.title}`);
  }
  if (updated) {
    if (previous && previous.stage !== updated.stage) await evaluateCustomNotificationRules(updated.id, "stage_changed");
    await evaluateCustomNotificationRules(updated.id, "score_threshold");
  }
  return updated;
}

export async function listSources() {
  const db = await requireDb();
  const [sourceRows, companyRows, opportunityRows] = await Promise.all([
    db.select().from(evidenceSources).orderBy(desc(evidenceSources.createdAt)),
    db.select().from(companies),
    db.select().from(opportunities),
  ]);
  const companyById = new Map(companyRows.map(row => [row.id, row]));
  const opportunityById = new Map(opportunityRows.map(row => [row.id, row]));
  return sourceRows.map(source => ({ ...source, company: companyById.get(source.companyId) ?? null, opportunity: source.opportunityId ? opportunityById.get(source.opportunityId) ?? null : null }));
}

export async function createSource(input: SourceInput) {
  const db = await requireDb();
  const result = await db.insert(evidenceSources).values({
    ...input,
    opportunityId: input.opportunityId ?? null,
    publishedAt: input.publishedAt ?? null,
    excerpt: emptyToNull(input.excerpt),
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(evidenceSources).where(eq(evidenceSources.id, id)).limit(1))[0];
}

export async function listContacts() {
  const db = await requireDb();
  const [contactRows, companyRows, logRows] = await Promise.all([
    db.select().from(contacts).orderBy(desc(contacts.updatedAt)),
    db.select().from(companies),
    db.select().from(contactLogs).orderBy(desc(contactLogs.contactedAt)),
  ]);
  const companyById = new Map(companyRows.map(row => [row.id, row]));
  const logsByContact = new Map<number, typeof logRows>();
  logRows.forEach(log => { if (log.contactId) logsByContact.set(log.contactId, [...(logsByContact.get(log.contactId) ?? []), log]); });
  return contactRows.map(contact => ({ ...contact, company: companyById.get(contact.companyId) ?? null, logs: logsByContact.get(contact.id) ?? [] }));
}

export async function createContact(input: ContactInput) {
  const db = await requireDb();
  const result = await db.insert(contacts).values({
    ...input,
    jobTitle: emptyToNull(input.jobTitle),
    department: emptyToNull(input.department),
    email: emptyToNull(input.email),
    phone: emptyToNull(input.phone),
    profileUrl: emptyToNull(input.profileUrl),
    sourceNote: emptyToNull(input.sourceNote),
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(contacts).where(eq(contacts.id, id)).limit(1))[0];
}

export async function createContactLog(input: ContactLogInput) {
  const db = await requireDb();
  const result = await db.insert(contactLogs).values({
    ...input,
    opportunityId: input.opportunityId ?? null,
    contactId: input.contactId ?? null,
    nextStep: emptyToNull(input.nextStep),
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(contactLogs).where(eq(contactLogs.id, id)).limit(1))[0];
}

export async function listContactLogs() {
  const db = await requireDb();
  return db.select().from(contactLogs).orderBy(desc(contactLogs.contactedAt));
}

export async function listReports() {
  const db = await requireDb();
  return db.select().from(weeklyReports).orderBy(desc(weeklyReports.periodStart));
}

export async function createReport(input: ReportInput) {
  const db = await requireDb();
  const result = await db.insert(weeklyReports).values(input);
  const id = Number(result[0].insertId);
  return (await db.select().from(weeklyReports).where(eq(weeklyReports.id, id)).limit(1))[0];
}

export async function getDashboardSnapshot() {
  const db = await requireDb();
  const [companyRows, facilityRows, opportunityRows, sourceRows, reportRows, notifications] = await Promise.all([
    db.select().from(companies), db.select().from(facilities), db.select().from(opportunities), db.select().from(evidenceSources), db.select().from(weeklyReports).orderBy(desc(weeklyReports.periodStart)).limit(1), db.select().from(notificationLogs).orderBy(desc(notificationLogs.createdAt)).limit(6),
  ]);
  return buildDashboardSnapshot({ companyRows, facilityRows, opportunityRows, sourceRows, reportRows, notifications });
}

export function buildDashboardSnapshot({ companyRows, facilityRows, opportunityRows, sourceRows, reportRows, notifications }: { companyRows: any[]; facilityRows: any[]; opportunityRows: any[]; sourceRows: any[]; reportRows: any[]; notifications: any[] }) {
  const countBy = (rows: any[], key: string) => rows.reduce<Record<string, number>>((accumulator, row) => {
    const value = String(row[key]);
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  const companyById = new Map(companyRows.map(row => [row.id, row]));
  const actionQueue = opportunityRows.filter(row => row.nextActionDue && row.nextActionDue <= soon && !["won", "lost"].includes(row.stage)).sort((a, b) => (a.nextActionDue?.getTime() ?? 0) - (b.nextActionDue?.getTime() ?? 0)).slice(0, 6).map(row => ({ ...row, company: companyById.get(row.companyId) ?? null }));
  return {
    stats: { companies: companyRows.length, facilities: facilityRows.length, opportunities: opportunityRows.length, highPriority: opportunityRows.filter(row => ["critical", "high"].includes(row.priority)).length, sources: sourceRows.length },
    distributions: { stage: countBy(opportunityRows, "stage"), priority: countBy(opportunityRows, "priority"), supplyChain: countSupplyChainDistribution(companyRows) },
    actionQueue,
    latestReport: reportRows[0] ?? null,
    notifications,
  };
}

export async function getMapLocations() {
  const db = await requireDb();
  const [facilityRows, companyRows, requirementRows] = await Promise.all([db.select().from(facilities), db.select().from(companies), db.select().from(networkRequirements)]);
  const companyById = new Map(companyRows.map(row => [row.id, row]));
  const requirementsByFacility = new Map<number, typeof requirementRows>();
  requirementRows.forEach(requirement => requirementsByFacility.set(requirement.facilityId, [...(requirementsByFacility.get(requirement.facilityId) ?? []), requirement]));
  return facilityRows.filter(row => row.latitude && row.longitude).map(row => ({ ...row, company: companyById.get(row.companyId) ?? null, requirements: requirementsByFacility.get(row.id) ?? [] }));
}

export async function updateFacility(id: number, input: FacilityInput) {
  const db = await requireDb();
  await db.update(facilities).set({ ...input, address: emptyToNull(input.address), latitude: emptyToNull(input.latitude), longitude: emptyToNull(input.longitude), notes: emptyToNull(input.notes) }).where(eq(facilities.id, id));
  return (await db.select().from(facilities).where(eq(facilities.id, id)).limit(1))[0];
}

export async function updateRequirement(id: number, input: RequirementInput) {
  const db = await requireDb();
  await db.update(networkRequirements).set({ ...input, bandwidth: emptyToNull(input.bandwidth), equipment: emptyToNull(input.equipment), estimatedTiming: emptyToNull(input.estimatedTiming), notes: emptyToNull(input.notes) }).where(eq(networkRequirements.id, id));
  return (await db.select().from(networkRequirements).where(eq(networkRequirements.id, id)).limit(1))[0];
}

export async function updateSource(id: number, input: SourceInput) {
  const db = await requireDb();
  await db.update(evidenceSources).set({ ...input, opportunityId: input.opportunityId ?? null, publishedAt: input.publishedAt ?? null, excerpt: emptyToNull(input.excerpt) }).where(eq(evidenceSources.id, id));
  return (await db.select().from(evidenceSources).where(eq(evidenceSources.id, id)).limit(1))[0];
}

export async function updateContact(id: number, input: ContactInput) {
  const db = await requireDb();
  await db.update(contacts).set({ ...input, jobTitle: emptyToNull(input.jobTitle), department: emptyToNull(input.department), email: emptyToNull(input.email), phone: emptyToNull(input.phone), profileUrl: emptyToNull(input.profileUrl), sourceNote: emptyToNull(input.sourceNote) }).where(eq(contacts.id, id));
  return (await db.select().from(contacts).where(eq(contacts.id, id)).limit(1))[0];
}

export async function updateContactLog(id: number, input: ContactLogInput) {
  const db = await requireDb();
  await db.update(contactLogs).set({ ...input, opportunityId: input.opportunityId ?? null, contactId: input.contactId ?? null, nextStep: emptyToNull(input.nextStep) }).where(eq(contactLogs.id, id));
  return (await db.select().from(contactLogs).where(eq(contactLogs.id, id)).limit(1))[0];
}

export async function updateReport(id: number, input: ReportInput) {
  const db = await requireDb();
  await db.update(weeklyReports).set(input).where(eq(weeklyReports.id, id));
  return (await db.select().from(weeklyReports).where(eq(weeklyReports.id, id)).limit(1))[0];
}

export async function geocodeFacility(id: number) {
  const db = await requireDb();
  const facility = (await db.select().from(facilities).where(eq(facilities.id, id)).limit(1))[0];
  if (!facility?.address) throw new Error("請先填入可核對的據點地址，再進行地圖定位。");
  const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { address: facility.address });
  const first = result.results[0];
  if (!first) throw new Error("找不到可用座標，請檢查地址是否完整。");
  await db.update(facilities).set({ address: first.formatted_address, latitude: String(first.geometry.location.lat), longitude: String(first.geometry.location.lng) }).where(eq(facilities.id, id));
  return (await db.select().from(facilities).where(eq(facilities.id, id)).limit(1))[0];
}

async function recordPriorityNotification(opportunity: typeof opportunities.$inferSelect, notificationType: "priority_created" | "stage_changed" | "action_due", title: string) {
  const db = await requireDb();
  const company = (await db.select().from(companies).where(eq(companies.id, opportunity.companyId)).limit(1))[0];
  const setting = await listMonitorSettings();
  const recipientName = setting?.recipientName?.trim() || "專案擁有者";
  const message = `${company?.name || "未對應企業"}｜${opportunity.title}｜${opportunity.nextAction || "請確認下一步行動"}`;
  const delivered = await notifyOwner({ title: recipientName === "專案擁有者" ? title : `${title}｜指定：${recipientName}`, content: message });
  await db.insert(notificationLogs).values({
    opportunityId: opportunity.id,
    notificationType,
    recipientName,
    deliveredAt: delivered ? new Date() : null,
    status: delivered ? "delivered" : "failed",
    message,
  });
}

export async function listMonitorSettings() {
  const db = await requireDb();
  return (await db.select().from(monitorSettings).limit(1))[0] ?? null;
}

export async function listScheduleRuns() {
  const db = await requireDb();
  return db.select().from(scheduleRuns).orderBy(desc(scheduleRuns.startedAt)).limit(12);
}

export async function startScheduleRun(jobType: "weekly_research" | "due_actions", taskUid: string) {
  const db = await requireDb();
  const result = await db.insert(scheduleRuns).values({ jobType, taskUid, status: "running" });
  return Number(result[0].insertId);
}

export async function completeScheduleRun(id: number, input: { status: "success" | "skipped"; reportId?: number | null; sourceCount?: number; opportunityCount?: number; message?: string }) {
  const db = await requireDb();
  await db.update(scheduleRuns).set({ status: input.status, reportId: input.reportId ?? null, sourceCount: input.sourceCount ?? 0, opportunityCount: input.opportunityCount ?? 0, message: emptyToNull(input.message), completedAt: new Date() }).where(eq(scheduleRuns.id, id));
}

export async function failScheduleRun(id: number, message: string) {
  const db = await requireDb();
  await db.update(scheduleRuns).set({ status: "failed", message: message.slice(0, 5000), completedAt: new Date() }).where(eq(scheduleRuns.id, id));
}

export async function updateMonitorSettings(input: { recipientName?: string }) {
  const db = await requireDb();
  const current = await listMonitorSettings();
  if (current) {
    await db.update(monitorSettings).set({ recipientName: emptyToNull(input.recipientName) }).where(eq(monitorSettings.id, current.id));
    return (await db.select().from(monitorSettings).where(eq(monitorSettings.id, current.id)).limit(1))[0];
  }
  const result = await db.insert(monitorSettings).values({ recipientName: emptyToNull(input.recipientName) });
  const id = Number(result[0].insertId);
  return (await db.select().from(monitorSettings).where(eq(monitorSettings.id, id)).limit(1))[0];
}

export async function listCustomNotificationRules() {
  const db = await requireDb();
  return db.select().from(customNotificationRules).orderBy(desc(customNotificationRules.updatedAt));
}

export async function createCustomNotificationRule(input: CustomNotificationRuleInput) {
  const db = await requireDb();
  const result = await db.insert(customNotificationRules).values({
    ...input,
    description: emptyToNull(input.description),
    keywords: emptyToNull(input.keywords),
    enabled: input.enabled ? 1 : 0,
    priority: input.priority ?? null,
    stage: input.stage ?? null,
    supplyChainStage: input.supplyChainStage ?? null,
    minScore: input.minScore ?? null,
    dueWithinHours: input.dueWithinHours ?? null,
  });
  return (await db.select().from(customNotificationRules).where(eq(customNotificationRules.id, Number(result[0].insertId))).limit(1))[0];
}

export async function updateCustomNotificationRule(id: number, input: CustomNotificationRuleInput) {
  const db = await requireDb();
  await db.update(customNotificationRules).set({
    ...input,
    description: emptyToNull(input.description),
    keywords: emptyToNull(input.keywords),
    enabled: input.enabled ? 1 : 0,
    priority: input.priority ?? null,
    stage: input.stage ?? null,
    supplyChainStage: input.supplyChainStage ?? null,
    minScore: input.minScore ?? null,
    dueWithinHours: input.dueWithinHours ?? null,
  }).where(eq(customNotificationRules.id, id));
  return (await db.select().from(customNotificationRules).where(eq(customNotificationRules.id, id)).limit(1))[0];
}

export async function deleteCustomNotificationRule(id: number) {
  const db = await requireDb();
  await db.delete(customNotificationRules).where(eq(customNotificationRules.id, id));
  return { ok: true };
}

type CustomNotificationEvent = "opportunity_created" | "stage_changed" | "score_threshold" | "action_due";

export function customNotificationMatches(rule: typeof customNotificationRules.$inferSelect, opportunity: typeof opportunities.$inferSelect, company: typeof companies.$inferSelect | undefined, event: CustomNotificationEvent, now = new Date()) {
  if (!rule.enabled || rule.triggerType !== event) return false;
  if (rule.priority && rule.priority !== opportunity.priority) return false;
  if (rule.stage && rule.stage !== opportunity.stage) return false;
  if (rule.supplyChainStage && rule.supplyChainStage !== company?.supplyChainStage) return false;
  if (rule.minScore !== null && rule.minScore !== undefined && opportunity.score < rule.minScore) return false;
  if (event === "action_due") {
    if (!opportunity.nextActionDue) return false;
    const dueWithinHours = rule.dueWithinHours ?? 24;
    const diffHours = (opportunity.nextActionDue.getTime() - now.getTime()) / 3600000;
    if (diffHours > dueWithinHours || diffHours < -1) return false;
  }
  const terms = (rule.keywords ?? "").split(",").map(term => term.trim().toLowerCase()).filter(Boolean);
  if (terms.length) {
    const haystack = [opportunity.title, opportunity.nextAction, opportunity.serviceHypothesis, opportunity.verificationQuestion, company?.name, company?.subCategory, company?.description].filter(Boolean).join(" ").toLowerCase();
    if (!terms.some(term => haystack.includes(term))) return false;
  }
  if (rule.lastTriggeredAt && now.getTime() - rule.lastTriggeredAt.getTime() < rule.cooldownHours * 3600000) return false;
  return true;
}

export async function evaluateCustomNotificationRules(opportunityId: number, event: CustomNotificationEvent, now = new Date()) {
  const db = await requireDb();
  const opportunity = (await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1))[0];
  if (!opportunity) return 0;
  const company = (await db.select().from(companies).where(eq(companies.id, opportunity.companyId)).limit(1))[0];
  const rules = await db.select().from(customNotificationRules).where(eq(customNotificationRules.enabled, 1));
  const setting = await listMonitorSettings();
  const recipientName = setting?.recipientName?.trim() || "專案擁有者";
  let deliveredCount = 0;
  for (const rule of rules.filter(candidate => customNotificationMatches(candidate, opportunity, company, event, now))) {
    const message = `${company?.name || "未對應企業"}｜${opportunity.title}｜${opportunity.nextAction || "請確認下一步行動"}`;
    const delivered = await notifyOwner({ title: `自訂通知｜${rule.name}`, content: message });
    await db.insert(notificationLogs).values({ opportunityId, customRuleId: rule.id, notificationType: "custom_rule", recipientName, deliveredAt: delivered ? now : null, status: delivered ? "delivered" : "failed", message });
    await db.update(customNotificationRules).set({ lastTriggeredAt: now }).where(eq(customNotificationRules.id, rule.id));
    if (delivered) deliveredCount += 1;
  }
  return deliveredCount;
}

export async function configureMonitorSchedule(taskUid: string, nextRunAt?: Date | null) {
  const db = await requireDb();
  const current = await listMonitorSettings();
  if (current) {
    await db.update(monitorSettings).set({ scheduleCronTaskUid: taskUid, scheduleEnabled: 1, nextRunAt: nextRunAt ?? null }).where(eq(monitorSettings.id, current.id));
    return;
  }
  await db.insert(monitorSettings).values({ scheduleCronTaskUid: taskUid, scheduleEnabled: 1, nextRunAt: nextRunAt ?? null });
}

export async function runWeeklyResearch(taskUid: string, payload: WeeklyResearchPayload) {
  const db = await requireDb();
  let setting = (await db.select().from(monitorSettings).where(and(eq(monitorSettings.scheduleCronTaskUid, taskUid), eq(monitorSettings.scheduleEnabled, 1))).limit(1))[0];
  if (!setting) {
    const existing = await listMonitorSettings();
    if (existing && existing.scheduleCronTaskUid && existing.scheduleCronTaskUid !== taskUid) return { ok: true, skipped: "different_schedule_already_configured" as const };
    await configureMonitorSchedule(taskUid);
    setting = (await db.select().from(monitorSettings).where(eq(monitorSettings.scheduleCronTaskUid, taskUid)).limit(1))[0];
  }
  if (!setting) return { ok: true, skipped: "schedule_not_configured" as const };
  const existing = (await db.select().from(weeklyReports).where(eq(weeklyReports.periodStart, payload.report.periodStart)).limit(1))[0];
  if (existing) return { ok: true, skipped: "report_period_already_processed" as const, reportId: existing.id };

  let sourceCount = 0;
  let opportunityCount = 0;
  for (const finding of payload.findings) {
    const existingCompany = (await db.select().from(companies).where(eq(companies.name, finding.company.name)).limit(1))[0];
    let companyId = existingCompany?.id;
    if (existingCompany) {
      await db.update(companies).set({ ...finding.company, city: emptyToNull(finding.company.city), website: emptyToNull(finding.company.website), description: emptyToNull(finding.company.description) }).where(eq(companies.id, existingCompany.id));
    } else {
      companyId = (await createCompany(finding.company)).id;
    }
    const existingFacilities = await db.select().from(facilities).where(eq(facilities.companyId, companyId!));
    const facilityByName = new Map(existingFacilities.map(facility => [facility.name, facility]));
    for (const facilityInput of finding.facilities) {
      if (!facilityByName.has(facilityInput.name)) {
        const result = await db.insert(facilities).values({ companyId: companyId!, ...facilityInput, address: emptyToNull(facilityInput.address), latitude: emptyToNull(facilityInput.latitude), longitude: emptyToNull(facilityInput.longitude), notes: emptyToNull(facilityInput.notes) });
        const id = Number(result[0].insertId);
        facilityByName.set(facilityInput.name, (await db.select().from(facilities).where(eq(facilities.id, id)).limit(1))[0]);
      }
    }
    const existingOpportunities = await db.select().from(opportunities).where(eq(opportunities.companyId, companyId!));
    const opportunityByTitle = new Map(existingOpportunities.map(opportunity => [opportunity.title, opportunity]));
    for (const opportunityInput of finding.opportunities) {
      const facility = opportunityInput.facilityName ? facilityByName.get(opportunityInput.facilityName) : undefined;
      const normalized: OpportunityInput = { companyId: companyId!, facilityId: facility?.id ?? null, title: opportunityInput.title, owner: opportunityInput.owner, stage: opportunityInput.stage, priority: opportunityInput.priority, score: opportunityInput.score, estimatedAmount: opportunityInput.estimatedAmount ?? null, nextAction: opportunityInput.nextAction, nextActionDue: opportunityInput.nextActionDue ?? null, serviceHypothesis: opportunityInput.serviceHypothesis, verificationQuestion: opportunityInput.verificationQuestion };
      const existingOpportunity = opportunityByTitle.get(opportunityInput.title);
      if (existingOpportunity) await updateOpportunity(existingOpportunity.id, normalized);
      else { const created = await createOpportunity(normalized); opportunityByTitle.set(created.title, created); opportunityCount += 1; }
    }
    for (const sourceInput of finding.sources) {
      const linkedOpportunity = sourceInput.opportunityTitle ? opportunityByTitle.get(sourceInput.opportunityTitle) : undefined;
      const duplicate = (await db.select().from(evidenceSources).where(and(eq(evidenceSources.companyId, companyId!), eq(evidenceSources.url, sourceInput.url))).limit(1))[0];
      if (!duplicate) {
        await db.insert(evidenceSources).values({ companyId: companyId!, opportunityId: linkedOpportunity?.id ?? null, sourceType: sourceInput.sourceType, quality: sourceInput.quality, title: sourceInput.title, url: sourceInput.url, publishedAt: sourceInput.publishedAt ?? null, excerpt: emptyToNull(sourceInput.excerpt) });
        sourceCount += 1;
      }
    }
  }
  const result = await db.insert(weeklyReports).values({ ...payload.report, opportunityCount, sourceCount });
  const reportId = Number(result[0].insertId);
  await db.update(monitorSettings).set({ lastRunAt: new Date() }).where(eq(monitorSettings.id, setting.id));
  return { ok: true, reportId, sourceCount, opportunityCount };
}

export async function notifyDueOpportunities(taskUid: string) {
  const db = await requireDb();
  const setting = await listMonitorSettings();
  if (!setting) return { ok: true, skipped: "schedule_not_configured" as const };
  if (!setting.scheduleEnabled) return { ok: true, skipped: "schedule_disabled" as const };
  if (setting.dueActionCronTaskUid && setting.dueActionCronTaskUid !== taskUid) return { ok: true, skipped: "different_schedule" as const };
  const today = taipeiDayStart();
  const dueItems = await db.select().from(opportunities).where(lte(opportunities.nextActionDue, new Date()));
  const eligible = dueItems.filter(item => ["critical", "high"].includes(item.priority) && !["won", "lost"].includes(item.stage));
  let notified = 0;
  for (const opportunity of eligible) {
    const alreadySent = (await db.select().from(notificationLogs).where(and(eq(notificationLogs.opportunityId, opportunity.id), eq(notificationLogs.notificationType, "action_due"), gte(notificationLogs.createdAt, today))).limit(1))[0];
    if (!alreadySent) { await recordPriorityNotification(opportunity, "action_due", `高優先商機已到下一步行動日期：${opportunity.title}`); await evaluateCustomNotificationRules(opportunity.id, "action_due"); notified += 1; }
  }
  const customDueRules = await db.select().from(customNotificationRules).where(and(eq(customNotificationRules.enabled, 1), eq(customNotificationRules.triggerType, "action_due")));
  if (customDueRules.length) {
    const maxDueHours = Math.max(...customDueRules.map(rule => rule.dueWithinHours ?? 24));
    const customDueItems = await db.select().from(opportunities).where(lte(opportunities.nextActionDue, new Date(Date.now() + maxDueHours * 3600000)));
    for (const opportunity of customDueItems.filter(item => !["won", "lost"].includes(item.stage))) await evaluateCustomNotificationRules(opportunity.id, "action_due");
  }
  return { ok: true, notified, skippedDuplicates: eligible.length - notified };
}
