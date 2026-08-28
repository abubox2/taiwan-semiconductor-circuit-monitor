import { beforeEach, describe, expect, it, vi } from "vitest";
import { monitorSettings, notificationLogs, opportunities } from "../drizzle/schema";

const state = vi.hoisted(() => ({ getDb: vi.fn(), notifyOwner: vi.fn() }));
vi.mock("./db", () => ({ getDb: state.getDb }));
vi.mock("./_core/notification", () => ({ notifyOwner: state.notifyOwner }));

const { notifyDueOpportunities } = await import("./monitoringDb");

describe("每日到期提醒去重", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("當同一高優先商機已具台灣當日 action_due 紀錄時，不再建立或派送第二次通知", async () => {
    const setting = { id: 1, scheduleEnabled: 1, dueActionCronTaskUid: "daily-task" };
    const dueOpportunity = { id: 18, companyId: 3, title: "高優先到期驗證", priority: "high", stage: "qualified", nextActionDue: new Date("2026-08-30T16:00:00.000Z") };
    const existingNotification = { id: 44, opportunityId: 18, notificationType: "action_due", createdAt: new Date("2026-08-31T01:00:00.000Z") };
    const rowsFor = (table: unknown) => table === monitorSettings ? [setting] : table === opportunities ? [dueOpportunity] : table === notificationLogs ? [existingNotification] : [];
    const database = {
      select: vi.fn(() => ({ from: (table: unknown) => {
        const rows = rowsFor(table);
        const query = Object.assign(Promise.resolve(rows), { limit: vi.fn(async () => rows) });
        return { limit: query.limit, where: vi.fn(() => query) };
      } })),
      insert: vi.fn(),
    };
    state.getDb.mockResolvedValue(database);

    const result = await notifyDueOpportunities("daily-task");

    expect(result).toEqual({ ok: true, notified: 0, skippedDuplicates: 1 });
    expect(database.insert).not.toHaveBeenCalled();
    expect(state.notifyOwner).not.toHaveBeenCalled();
  });
});
