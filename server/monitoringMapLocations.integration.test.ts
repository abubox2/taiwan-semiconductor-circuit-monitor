import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getMapLocations } from "./monitoringDb";

describe("真實據點地圖資料", () => {
  it("從正式資料服務回傳具有公開座標的晶圓十八廠", async () => {
    const locations = await getMapLocations();
    const fab18 = locations.find(location => location.id === 2);

    expect(fab18).toMatchObject({
      name: "晶圓十八廠",
      region: "南部科學園區",
      city: "台南市",
      latitude: "23.1163159",
      longitude: "120.2641416",
      company: { name: "台灣積體電路製造股份有限公司" },
    });
    await writeFile(new URL("../docs/map_locations_actual.json", import.meta.url), JSON.stringify({ validatedBy: "monitoringMapLocations.integration.test.ts", validatedAt: new Date().toISOString(), dataService: "getMapLocations", locations }, null, 2));
  });
});
