import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { completeScheduleRun, failScheduleRun, notifyDueOpportunities, runWeeklyResearch, startScheduleRun } from "./monitoringDb";
import { weeklyResearchPayloadSchema } from "./monitoringSchemas";

function errorPayload(error: unknown, req: Request, taskUid?: string) {
  return {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: { url: req.originalUrl, taskUid },
    timestamp: new Date().toISOString(),
  };
}

export async function weeklyResearchHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  let runId: number | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    runId = await startScheduleRun("weekly_research", taskUid);
    const payload = weeklyResearchPayloadSchema.parse(req.body);
    const result = await runWeeklyResearch(taskUid, payload);
    const skipped = "skipped" in result;
    await completeScheduleRun(runId, { status: skipped ? "skipped" : "success", reportId: "reportId" in result ? result.reportId ?? null : null, sourceCount: "sourceCount" in result ? result.sourceCount : 0, opportunityCount: "opportunityCount" in result ? result.opportunityCount : 0, message: skipped ? String(result.skipped) : "研究資料已成功寫回平台。" });
    return res.json(result);
  } catch (error) {
    if (runId) await failScheduleRun(runId, error instanceof Error ? error.message : String(error));
    return res.status(500).json(errorPayload(error, req, taskUid));
  }
}

export async function dueActionHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  let runId: number | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    runId = await startScheduleRun("due_actions", taskUid);
    const result = await notifyDueOpportunities(taskUid);
    await completeScheduleRun(runId, { status: "skipped" in result ? "skipped" : "success", message: "skipped" in result ? String(result.skipped) : `已通知 ${result.notified} 筆，略過 ${result.skippedDuplicates} 筆重複提醒。` });
    return res.json(result);
  } catch (error) {
    if (runId) await failScheduleRun(runId, error instanceof Error ? error.message : String(error));
    return res.status(500).json(errorPayload(error, req, taskUid));
  }
}
