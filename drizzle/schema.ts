import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  supplyChainStage: mysqlEnum("supplyChainStage", ["upstream", "midstream", "downstream"]).notNull(),
  subCategory: varchar("subCategory", { length: 160 }),
  ticker: varchar("ticker", { length: 20 }),
  region: varchar("region", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }),
  status: mysqlEnum("status", ["verified", "review", "nurture"]).default("review").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  score: int("score").default(0).notNull(),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("companies_stage_region_idx").on(table.supplyChainStage, table.region),
  index("companies_stage_subcategory_idx").on(table.supplyChainStage, table.subCategory),
  index("companies_priority_idx").on(table.priority),
]);

export const facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  facilityType: mysqlEnum("facilityType", ["fab", "datacenter", "office", "rd", "warehouse", "other"]).notNull(),
  region: varchar("region", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  address: text("address"),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  operationalStatus: mysqlEnum("operationalStatus", ["planning", "construction", "operational", "expansion"]).default("planning").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("facilities_company_idx").on(table.companyId),
  index("facilities_region_city_idx").on(table.region, table.city),
]);

export const networkRequirements = mysqlTable("networkRequirements", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull(),
  requirementType: mysqlEnum("requirementType", ["leased_line", "dia", "dci", "cloud_connect", "iepl_iplc", "backup", "network_equipment", "other"]).notNull(),
  bandwidth: varchar("bandwidth", { length: 120 }),
  equipment: text("equipment"),
  estimatedTiming: varchar("estimatedTiming", { length: 160 }),
  scale: mysqlEnum("scale", ["pilot", "site", "multi_site", "enterprise"]).default("site").notNull(),
  confidence: mysqlEnum("confidence", ["verified", "review", "nurture"]).default("review").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("network_requirements_facility_idx").on(table.facilityId)]);

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  facilityId: int("facilityId"),
  title: varchar("title", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 120 }),
  stage: mysqlEnum("stage", ["discovery", "qualified", "solution", "proposal", "negotiation", "won", "lost"]).default("discovery").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  score: int("score").default(0).notNull(),
  estimatedAmount: int("estimatedAmount"),
  nextAction: text("nextAction"),
  nextActionDue: timestamp("nextActionDue"),
  serviceHypothesis: text("serviceHypothesis"),
  verificationQuestion: text("verificationQuestion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("opportunities_company_idx").on(table.companyId),
  index("opportunities_stage_priority_idx").on(table.stage, table.priority),
  index("opportunities_due_idx").on(table.nextActionDue),
]);

export const evidenceSources = mysqlTable("evidenceSources", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  opportunityId: int("opportunityId"),
  sourceType: mysqlEnum("sourceType", ["company", "government", "filing", "media", "industry", "other"]).notNull(),
  quality: mysqlEnum("quality", ["primary", "secondary", "lead"]).default("secondary").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  publishedAt: timestamp("publishedAt"),
  excerpt: text("excerpt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("evidence_company_idx").on(table.companyId),
  index("evidence_opportunity_idx").on(table.opportunityId),
]);

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 255 }),
  department: varchar("department", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 80 }),
  profileUrl: varchar("profileUrl", { length: 1000 }),
  sourceNote: text("sourceNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("contacts_company_idx").on(table.companyId)]);

export const contactLogs = mysqlTable("contactLogs", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  opportunityId: int("opportunityId"),
  contactId: int("contactId"),
  channel: mysqlEnum("channel", ["call", "email", "meeting", "message", "other"]).notNull(),
  contactedAt: timestamp("contactedAt").notNull(),
  summary: text("summary").notNull(),
  nextStep: text("nextStep"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("contact_logs_company_idx").on(table.companyId),
  index("contact_logs_opportunity_idx").on(table.opportunityId),
]);

export const weeklyReports = mysqlTable("weeklyReports", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  opportunityCount: int("opportunityCount").default(0).notNull(),
  sourceCount: int("sourceCount").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
}, table => [index("weekly_reports_period_idx").on(table.periodStart)]);

export const monitorSettings = mysqlTable("monitorSettings", {
  id: int("id").autoincrement().primaryKey(),
  weeklyCron: varchar("weeklyCron", { length: 64 }).default("0 0 1 * * 0").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Taipei").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  dueActionCronTaskUid: varchar("dueActionCronTaskUid", { length: 65 }),
  scheduleEnabled: int("scheduleEnabled").default(0).notNull(),
  recipientName: varchar("recipientName", { length: 160 }),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("monitor_settings_schedule_uid_idx").on(table.scheduleCronTaskUid), index("monitor_settings_due_action_uid_idx").on(table.dueActionCronTaskUid)]);

export const scheduleRuns = mysqlTable("scheduleRuns", {
  id: int("id").autoincrement().primaryKey(),
  jobType: mysqlEnum("jobType", ["weekly_research", "due_actions"]).notNull(),
  taskUid: varchar("taskUid", { length: 65 }).notNull(),
  status: mysqlEnum("status", ["running", "success", "skipped", "failed"]).default("running").notNull(),
  reportId: int("reportId"),
  sourceCount: int("sourceCount").default(0).notNull(),
  opportunityCount: int("opportunityCount").default(0).notNull(),
  message: text("message"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, table => [index("schedule_runs_task_idx").on(table.taskUid), index("schedule_runs_type_started_idx").on(table.jobType, table.startedAt)]);

export const notificationLogs = mysqlTable("notificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull(),
  customRuleId: int("customRuleId"),
  notificationType: mysqlEnum("notificationType", ["priority_created", "stage_changed", "action_due", "custom_rule"]).notNull(),
  recipientName: varchar("recipientName", { length: 160 }),
  deliveredAt: timestamp("deliveredAt"),
  status: mysqlEnum("status", ["pending", "delivered", "failed"]).default("pending").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("notification_opportunity_idx").on(table.opportunityId)]);

export const customNotificationRules = mysqlTable("customNotificationRules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  keywords: text("keywords"),
  triggerType: mysqlEnum("triggerType", ["opportunity_created", "stage_changed", "score_threshold", "action_due"]).notNull(),
  enabled: int("enabled").default(1).notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]),
  stage: mysqlEnum("stage", ["discovery", "qualified", "solution", "proposal", "negotiation", "won", "lost"]),
  supplyChainStage: mysqlEnum("supplyChainStage", ["upstream", "midstream", "downstream"]),
  minScore: int("minScore"),
  dueWithinHours: int("dueWithinHours"),
  cooldownHours: int("cooldownHours").default(24).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("custom_notification_rules_enabled_idx").on(table.enabled), index("custom_notification_rules_trigger_idx").on(table.triggerType)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CustomNotificationRule = typeof customNotificationRules.$inferSelect;
export type InsertCustomNotificationRule = typeof customNotificationRules.$inferInsert;
export type Company = typeof companies.$inferSelect;
