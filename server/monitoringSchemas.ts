import { z } from "zod";

export const supplyChainStages = ["upstream", "midstream", "downstream"] as const;
export const priorities = ["critical", "high", "medium", "low"] as const;
export const opportunityStages = ["discovery", "qualified", "solution", "proposal", "negotiation", "won", "lost"] as const;
export const customNotificationTriggerTypes = ["opportunity_created", "stage_changed", "score_threshold", "action_due"] as const;
export const fixedNotificationKeywords = ["自用資料中心", "舊廠改建", "AI Data Platform", "企業地端 AI"] as const;

const optionalText = (max = 1000) => z.string().trim().max(max).optional().transform(value => value || undefined);

export const companyInputSchema = z.object({
  name: z.string().trim().min(2).max(255),
  supplyChainStage: z.enum(supplyChainStages),
  subCategory: optionalText(160),
  ticker: optionalText(20),
  region: z.string().trim().min(1).max(120),
  city: optionalText(120),
  status: z.enum(["verified", "review", "nurture"]),
  priority: z.enum(priorities),
  score: z.number().int().min(0).max(100),
  website: optionalText(500),
  description: optionalText(5000),
});

export const facilityInputSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().trim().min(2).max(255),
  facilityType: z.enum(["fab", "datacenter", "office", "rd", "warehouse", "other"]),
  region: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  address: optionalText(1000),
  latitude: optionalText(32),
  longitude: optionalText(32),
  operationalStatus: z.enum(["planning", "construction", "operational", "expansion"]),
  notes: optionalText(5000),
});

export const requirementInputSchema = z.object({
  facilityId: z.number().int().positive(),
  requirementType: z.enum(["leased_line", "dia", "dci", "cloud_connect", "iepl_iplc", "backup", "network_equipment", "other"]),
  bandwidth: optionalText(120),
  equipment: optionalText(5000),
  estimatedTiming: optionalText(160),
  scale: z.enum(["pilot", "site", "multi_site", "enterprise"]),
  confidence: z.enum(["verified", "review", "nurture"]),
  notes: optionalText(5000),
});

export const opportunityInputSchema = z.object({
  companyId: z.number().int().positive(),
  facilityId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(2).max(255),
  owner: optionalText(120),
  stage: z.enum(opportunityStages),
  priority: z.enum(priorities),
  score: z.number().int().min(0).max(100),
  estimatedAmount: z.number().int().min(0).nullable().optional(),
  nextAction: optionalText(5000),
  nextActionDue: z.coerce.date().nullable().optional(),
  serviceHypothesis: optionalText(5000),
  verificationQuestion: optionalText(5000),
});

export const sourceInputSchema = z.object({
  companyId: z.number().int().positive(),
  opportunityId: z.number().int().positive().nullable().optional(),
  sourceType: z.enum(["company", "government", "filing", "media", "industry", "other"]),
  quality: z.enum(["primary", "secondary", "lead"]),
  title: z.string().trim().min(2).max(500),
  url: z.string().url().max(1000),
  publishedAt: z.coerce.date().nullable().optional(),
  excerpt: optionalText(5000),
});

export const customNotificationRuleInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: optionalText(1000),
  keywords: optionalText(500),
  triggerType: z.enum(customNotificationTriggerTypes),
  enabled: z.boolean(),
  priority: z.enum(priorities).nullable().optional(),
  stage: z.enum(opportunityStages).nullable().optional(),
  supplyChainStage: z.enum(supplyChainStages).nullable().optional(),
  minScore: z.number().int().min(0).max(100).nullable().optional(),
  dueWithinHours: z.number().int().min(1).max(720).nullable().optional(),
  cooldownHours: z.number().int().min(1).max(720),
});

export const contactInputSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().trim().min(2).max(160),
  jobTitle: optionalText(255),
  department: optionalText(255),
  email: z.string().email().max(320).optional().or(z.literal("")),
  phone: optionalText(80),
  profileUrl: z.string().url().max(1000).optional().or(z.literal("")),
  sourceNote: optionalText(5000),
});

export const contactLogInputSchema = z.object({
  companyId: z.number().int().positive(),
  opportunityId: z.number().int().positive().nullable().optional(),
  contactId: z.number().int().positive().nullable().optional(),
  channel: z.enum(["call", "email", "meeting", "message", "other"]),
  contactedAt: z.coerce.date(),
  summary: z.string().trim().min(2).max(5000),
  nextStep: optionalText(5000),
});

export const reportInputSchema = z.object({
  title: z.string().trim().min(2).max(255),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  summary: z.string().trim().min(2).max(5000),
  content: z.string().trim().min(2).max(30000),
  opportunityCount: z.number().int().min(0),
  sourceCount: z.number().int().min(0),
  status: z.enum(["draft", "published"]),
});

export const defaultWeeklySchedule = {
  timezone: "Asia/Taipei",
  weeklyCron: "0 0 1 * * 0",
  display: "每週一 09:00（台灣時間）",
} as const;

const researchFacilitySchema = z.object({
  name: z.string().trim().min(2).max(255),
  facilityType: z.enum(["fab", "datacenter", "office", "rd", "warehouse", "other"]),
  region: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  address: optionalText(1000),
  latitude: optionalText(32),
  longitude: optionalText(32),
  operationalStatus: z.enum(["planning", "construction", "operational", "expansion"]),
  notes: optionalText(5000),
});

const researchOpportunitySchema = z.object({
  title: z.string().trim().min(2).max(255),
  facilityName: z.string().trim().max(255).optional(),
  owner: optionalText(120),
  stage: z.enum(opportunityStages),
  priority: z.enum(priorities),
  score: z.number().int().min(0).max(100),
  estimatedAmount: z.number().int().min(0).nullable().optional(),
  nextAction: optionalText(5000),
  nextActionDue: z.coerce.date().nullable().optional(),
  serviceHypothesis: optionalText(5000),
  verificationQuestion: optionalText(5000),
});

const researchSourceSchema = z.object({
  sourceType: z.enum(["company", "government", "filing", "media", "industry", "other"]),
  quality: z.enum(["primary", "secondary", "lead"]),
  title: z.string().trim().min(2).max(500),
  url: z.string().url().max(1000),
  publishedAt: z.coerce.date().nullable().optional(),
  excerpt: optionalText(5000),
  opportunityTitle: z.string().trim().max(255).optional(),
});

export const weeklyResearchPayloadSchema = z.object({
  report: z.object({
    title: z.string().trim().min(2).max(255),
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    summary: z.string().trim().min(2).max(5000),
    content: z.string().trim().min(2).max(30000),
    status: z.enum(["draft", "published"]).default("published"),
  }),
  findings: z.array(z.object({
    company: companyInputSchema,
    facilities: z.array(researchFacilitySchema).max(12).default([]),
    opportunities: z.array(researchOpportunitySchema).max(12).default([]),
    sources: z.array(researchSourceSchema).min(1).max(20),
  })).max(40),
});
