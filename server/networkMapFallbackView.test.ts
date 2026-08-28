import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MapFallbackList } from "../client/src/pages/NetworkMapPage";

describe("地圖備援位置清單", () => {
  it("在外部地圖不可用時直接顯示晶圓十八廠、企業、地區與座標", () => {
    const markup = renderToStaticMarkup(createElement(MapFallbackList, { mapUnavailable: true, locations: [{ id: 2, name: "晶圓十八廠", region: "南部科學園區", city: "台南市", latitude: "23.1163159", longitude: "120.2641416", company: { name: "台灣積體電路製造股份有限公司" }, requirements: [] }] }));
    expect(markup).toContain("地圖備援位置清單");
    expect(markup).toContain("晶圓十八廠");
    expect(markup).toContain("台灣積體電路製造股份有限公司");
    expect(markup).toContain("南部科學園區 · 台南市");
    expect(markup).toContain("23.11632, 120.26414");
  });
});
