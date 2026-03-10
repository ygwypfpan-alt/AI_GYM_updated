# RELEASE NOTES

## Unreleased: next-step branch

- Added minimal admin login with env credentials and JWT
- Protected `/api/admin/dashboard` and added `/api/admin/me`
- Added `POST /api/bookings/lookup` for phone + email based lookup
- Added home page "My bookings" management flow for reschedule / cancel
- Added e2e coverage for admin auth and booking lookup flows
- Updated scripts to auto-start the local bundled PostgreSQL before setup/dev/test

## AI_GYM v0.1.0-mvp

發布日期：2026-03-10
版本標記：`v0.1.0-mvp`

## 版本定位

這是一個可本機啟動、可測試、可展示的「健身房 AI 預約機器人 MVP」版本。
本版以 Windows + Node.js 20 LTS + PostgreSQL 本機開發環境為基準完成冷啟動驗收。

## 已完成驗收

以下項目已驗證通過：

- Node.js `v20.20.1`
- `scripts/setup.ps1` 可完整初始化專案
- `scripts/dev.ps1` 可成功啟動 Web / API
- `scripts/test.ps1` 與 `pnpm test` 可成功執行
- `http://localhost:3001/health` 正常
- `http://localhost:3000` 正常
- `http://localhost:3000/admin` 正常
- 中文聊天判斷正常：
  - `營業時間幾點到幾點？` -> `FAQ`
  - `今晚還有團體燃脂課嗎？` -> `AVAILABILITY`
  - `我要真人協助` -> `HANDOFF`
- 預約建立、改期、取消流程可執行
- 改期後 booking 狀態維持 `BOOKED`
- Admin dashboard 可顯示 bookings / faq_items / conversations / handoff_requests

## 正確初始化流程

請依序執行：

```powershell
Copy-Item .env.example .env
PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

## 資料庫與 seed

本 repo 的正確 seed 入口為：

```powershell
pnpm --filter @ai-gym/db prisma:seed
```

不要使用 `prisma db seed` 當作主要初始化入口，因為本專案使用的是 custom seed script。

## 已知限制

本版為 MVP / Demo 版，仍有以下限制：

- 聊天採規則式 intent 判斷，非外部 LLM
- Admin 頁無登入驗證，不可直接公開上線
- availability 規則為 MVP 等級，未涵蓋例外日、休館日、教練請假等進階情境
- 未整合通知、付款、LINE、Email、簡訊或外部客服系統
- 目前以本機 demo 與交接可跑為優先，不含 Docker / CI/CD / 正式部署設定

## 建議交接方式

新接手者請先：

1. 安裝 Node.js 20 LTS、pnpm、PostgreSQL
2. 依 README 執行初始化
3. 跑一次 `scripts/test.ps1`
4. 依 README 的 demo 流程手動走一輪聊天、預約、改期、取消、轉真人

## 關鍵修正摘要

本版鎖版前已修正：

- 中文 intent 判斷過弱導致 `UNKNOWN`
- 改期流程回傳 booking 狀態異常
- PowerShell setup 腳本與實際 seed 方式不一致
- 測試環境讀不到 `.env`
- Windows + Prisma 初始化流程穩定性問題
