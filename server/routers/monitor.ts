import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../monitoringDb";
import {
  companyInputSchema,
  contactInputSchema,
  contactLogInputSchema,
  facilityInputSchema,
  opportunityInputSchema,
  reportInputSchema,
  requirementInputSchema,
  sourceInputSchema,
} from "../monitoringSchemas";

const optionalFilterText = z.string().trim().max(120).optional();

export const monitorRouter = router({
  dashboard: protectedProcedure.query(() => db.getDashboardSnapshot()),
  listCompanies: protectedProcedure.input(z.object({ search: optionalFilterText, stage: optionalFilterText, subCategory: optionalFilterText, region: optionalFilterText }).optional()).query(({ input }) => db.listCompanies(input)),
  createCompany: protectedProcedure.input(companyInputSchema).mutation(({ input }) => db.createCompany(input)),
  updateCompany: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: companyInputSchema })).mutation(({ input }) => db.updateCompany(input.id, input.data)),
  listFacilities: protectedProcedure.query(() => db.listFacilities()),
  createFacility: protectedProcedure.input(facilityInputSchema).mutation(({ input }) => db.createFacility(input)),
  updateFacility: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: facilityInputSchema })).mutation(({ input }) => db.updateFacility(input.id, input.data)),
  geocodeFacility: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.geocodeFacility(input.id)),
  createRequirement: protectedProcedure.input(requirementInputSchema).mutation(({ input }) => db.createRequirement(input)),
  updateRequirement: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: requirementInputSchema })).mutation(({ input }) => db.updateRequirement(input.id, input.data)),
  listOpportunities: protectedProcedure.input(z.object({ stage: optionalFilterText, priority: optionalFilterText, companyId: z.number().int().positive().optional() }).optional()).query(({ input }) => db.listOpportunities(input)),
  createOpportunity: protectedProcedure.input(opportunityInputSchema).mutation(({ input }) => db.createOpportunity(input)),
  updateOpportunity: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: opportunityInputSchema })).mutation(({ input }) => db.updateOpportunity(input.id, input.data)),
  listSources: protectedProcedure.query(() => db.listSources()),
  createSource: protectedProcedure.input(sourceInputSchema).mutation(({ input }) => db.createSource(input)),
  updateSource: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: sourceInputSchema })).mutation(({ input }) => db.updateSource(input.id, input.data)),
  listContacts: protectedProcedure.query(() => db.listContacts()),
  createContact: protectedProcedure.input(contactInputSchema).mutation(({ input }) => db.createContact(input)),
  updateContact: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: contactInputSchema })).mutation(({ input }) => db.updateContact(input.id, input.data)),
  createContactLog: protectedProcedure.input(contactLogInputSchema).mutation(({ input }) => db.createContactLog(input)),
  listContactLogs: protectedProcedure.query(() => db.listContactLogs()),
  updateContactLog: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: contactLogInputSchema })).mutation(({ input }) => db.updateContactLog(input.id, input.data)),
  listReports: protectedProcedure.query(() => db.listReports()),
  createReport: protectedProcedure.input(reportInputSchema).mutation(({ input }) => db.createReport(input)),
  updateReport: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: reportInputSchema })).mutation(({ input }) => db.updateReport(input.id, input.data)),
  mapLocations: protectedProcedure.query(() => db.getMapLocations()),
  monitorSettings: protectedProcedure.query(() => db.listMonitorSettings()),
  scheduleRuns: protectedProcedure.query(() => db.listScheduleRuns()),
  updateMonitorSettings: protectedProcedure.input(z.object({ recipientName: z.string().trim().max(160).optional() })).mutation(({ input }) => db.updateMonitorSettings(input)),
});
