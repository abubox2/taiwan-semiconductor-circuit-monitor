import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { notifyDueOpportunities, runWeeklyResearch } from "./monitoringDb";
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
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    const payload = weeklyResearchPayloadSchema.parse(req.body);
    const result = await runWeeklyResearch(taskUid, payload);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(errorPayload(error, req, taskUid));
  }
}

export async function dueActionHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    return res.json(await notifyDueOpportunities(taskUid));
  } catch (error) {
    return res.status(500).json(errorPayload(error, req, taskUid));
  }
}
