# 首頁儀表板資料一致性驗證

## 驗證基準

2026-08-27 已以登入預覽工作區檢視首頁決策總覽，畫面顯示的目標企業總數及供應鏈分布與資料庫查核一致。

| 指標 | 首頁儀表板實際顯示 | 資料庫查核 | 結果 |
|---|---:|---:|---|
| 目標企業 | 244 | 244 | 一致 |
| 上游材料／設備 | 59 | 59 | 一致 |
| 中游製造／封測 | 147 | 147 | 一致 |
| 下游系統／應用 | 38 | 38 | 一致 |

## 程式與測試控制

首頁 `monitor.dashboard` procedure 會呼叫 `getDashboardSnapshot()`。該快照使用與企業名錄相同的企業主檔資料列計算 `stats.companies` 與 `distributions.supplyChain`；企業名錄使用 `filterCompanyRows()` 產生篩選結果。`server/monitoringDashboard.test.ts` 以 59／147／38 共 244 筆企業資料驗證兩者的總數與供應鏈分布不會分歧，`server/monitoringRouter.test.ts` 另驗證 dashboard procedure 正確轉交快照資料服務。

預覽驗證後亦重新啟動服務，檢查排程處理器所引用的 `notifyDueOpportunities` 已由 `server/monitoringDb.ts` 匯出；近期啟動紀錄未再出現該模組匯入錯誤。公開訪客未帶登入 cookie 時，首頁會刻意顯示內部工作區登入頁，並不顯示儀表板資料。
