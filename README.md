# AI GYM

## Current Status

- Branch baseline: `codex/deploy-demo`
- Release status: demo-ready
- External demo validation: passed
- Core flows verified:
  - homepage load
  - API health
  - services / FAQ display
  - chat / FAQ / handoff
  - booking lookup
  - reschedule
  - cancel
  - admin login / dashboard

## Customer-Test Ready Delta

Work for `codex/feat/customer-test-ready` extends the locked demo baseline
without modifying `v0.3.1-final-handoff`.

This iteration adds only the minimum changes needed for limited external
customer testing:

- safer booking / lookup / reschedule / cancel edge-case handling
- seeded reset data that includes booked, cancelled, and completed examples
- basic admin booking search and status filtering
- stronger API/frontend fallback messages for network and deploy errors
- customer-test runbook guidance

New reset command aliases:

```powershell
pnpm demo:reset
pnpm customer-test:reset
```

Both commands restore the same seeded local baseline.


健身房 AI 預約機器人 MVP。這個版本刻意走最短可 demo 路徑，不依賴任何舊專案、外部 LLM、LINE、Email、簡訊或雲端服務。

## 1. 專案目標

完成一個本機可跑、可測、可展示的 MVP：

- 網站聊天視窗
- FAQ 問答
- 查詢可預約時段
- 建立預約
- 改期
- 取消預約
- 轉真人
- 基本後台管理頁

## 2. 技術棧

- Monorepo：pnpm workspace
- Node.js：20 LTS
- TypeScript
- Web：Next.js
- API：Express
- ORM：Prisma
- Database：PostgreSQL
- Test：Vitest + Supertest

## 3. 專案結構

```text
AI_GYM
├─ apps
│  ├─ api
│  └─ web
├─ packages
│  ├─ db
│  └─ shared
├─ tests
│  └─ e2e
└─ scripts
```

## 4. 主要功能完成情況

### 已完成

- `/health`
- FAQ 查詢 API
- 可預約時段查詢 API
- 建立預約 API
- 改期 API
- 取消預約 API
- 聊天訊息 API（規則式流程 + FAQ 關鍵字匹配 + 基本 intent 判斷）
- 轉真人請求 API
- 後台基本資料查詢 API
- 首頁 demo 頁
- 聊天視窗
- FAQ 顯示
- 預約 / 改期 / 取消互動
- 後台管理頁
- Prisma schema / migration / seed
- 最基本可執行測試

### 刻意先不做

- 登入驗證
- Docker / CI/CD
- OpenAI / LINE / WhatsApp / Email / SMS
- 向量資料庫
- WebSocket
- RBAC
- 複雜排程引擎

## 4.1 Next-Step Scope

This repo has a locked follow-up scope for `codex/feat/next-step`.

Goals for the next iteration:

- Add minimal admin login using env credentials and JWT
- Protect `/api/admin/*`
- Add booking lookup by `phone + email`
- Let users reschedule and cancel from the lookup flow
- Keep the scope at "demo to trial" and avoid production-only work

Current implementation status on this branch:

- `POST /api/admin/login` and `GET /api/admin/me` are implemented
- `/api/admin/dashboard` now requires `Authorization: Bearer <token>`
- The home page includes a "My bookings" lookup form using `phone + email`
- Lookup results can reschedule and cancel existing bookings

Explicitly out of scope for this iteration:

- Full auth / RBAC / refresh token
- External LLM / LINE / Email / SMS
- Docker / CI / deployment
- Large chat or booking architecture rewrites

See `NEXT_STEP_API_CONTRACT.md` and `NEXT_STEP_TODO.md` before starting implementation.

## 5. Windows 本機啟動

建議專案放在：

```text
C:\Users\USER\Desktop\AI_GYM
```

### Step 1. 準備環境

- Node.js 20 LTS
- PostgreSQL（預設走 `localhost:5432`）
- pnpm 9+

如果還沒有 pnpm：

```powershell
corepack enable
corepack prepare pnpm@9.12.1 --activate
```

### Step 2. 建立資料庫

先確認 PostgreSQL 已啟動，然後建立 `ai_gym` 資料庫。

可選做法（如果你有 `psql`）：

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\create-db.ps1
```

如果你的 PostgreSQL 帳密不是預設值，請手動建立資料庫並修改 `.env`。

### Step 3. 建立 `.env`

```powershell
Copy-Item .env.example .env
```

預設內容：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_gym?schema=public"
API_PORT=3001
WEB_PORT=3000
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
DEFAULT_BUSINESS_SLUG=ai-gym-demo
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
ADMIN_JWT_SECRET=change-this-to-a-long-random-string
```

### Step 4. 安裝依賴、migrate、seed

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

這個腳本會做：

1. 建立 `.env`
2. 同步 env 到 `apps/api`、`apps/web`、`packages/db`
3. `pnpm install`
4. `pnpm db:setup`

### Step 5. 啟動 web + api

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

這是目前 Windows demo 最穩定的啟動方式，會先 build 再用 production-like runtime 拉起 Web 與 API。

如果只是要做本機除錯，也可以直接：

```powershell
pnpm dev
```

但 `pnpm dev` 仍是 workspace 開發模式，穩定 demo / 錄影請優先使用 `scripts/dev.ps1`。

啟動後：

- Web: http://localhost:3000
- Admin: http://localhost:3000/admin
- API: http://localhost:3001
- Health: http://localhost:3001/health

## 6. Demo 流程

### 最短展示路徑

1. 打開首頁
2. 在聊天輸入：`今晚還有團體燃脂課嗎？`
3. 點選一個可預約時段
4. 成功建立預約後，使用下方「改期」
5. 再按「取消預約」
6. 輸入：`我要真人協助`
7. 到 `/admin` 查看新 booking、conversation、handoff request

### FAQ Demo 指令

- `請問營業時間是幾點到幾點？`
- `現場可以停車嗎？`
- `有提供淋浴間嗎？`
- `第一次來適合上什麼課？`

## 6.1 Demo-ready notes

- Stable local startup: `PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1`
- Stable demo reset: `pnpm demo:reset`
- Demo runbook: `DEMO_RUNBOOK.md`
- Deployment path and manual steps: `DEPLOYMENT.md`
- Default local demo admin credentials:
  - `ADMIN_USERNAME=admin`
  - `ADMIN_PASSWORD=admin123456`

## 7. API 清單

### Health

```http
GET /health
```

### Services

```http
GET /api/services?businessSlug=ai-gym-demo
```

### FAQ

```http
GET /api/faqs?businessSlug=ai-gym-demo&query=營業時間
```

### Availability

```http
GET /api/availability?businessSlug=ai-gym-demo&serviceId=<serviceId>&days=7
```

### Create Booking

```http
POST /api/bookings
Content-Type: application/json
```

```json
{
  "businessSlug": "ai-gym-demo",
  "serviceId": "SERVICE_ID",
  "staffId": "STAFF_ID",
  "slotStartAt": "2026-03-09T10:00:00.000Z",
  "customer": {
    "name": "Demo 使用者",
    "phone": "0900000000",
    "email": "demo@example.com"
  }
}
```

### Reschedule Booking

```http
PATCH /api/bookings/:bookingId/reschedule
Content-Type: application/json
```

```json
{
  "slotStartAt": "2026-03-10T10:00:00.000Z",
  "staffId": "STAFF_ID"
}
```

### Cancel Booking

```http
PATCH /api/bookings/:bookingId/cancel
Content-Type: application/json
```

```json
{
  "reason": "使用者於網站聊天視窗取消"
}
```

### Chat Message

```http
POST /api/chat/message
Content-Type: application/json
```

```json
{
  "businessSlug": "ai-gym-demo",
  "conversationId": "optional-conversation-id",
  "customer": {
    "name": "Demo 使用者",
    "phone": "0900000000",
    "email": "demo@example.com"
  },
  "message": "今晚還有團體燃脂課嗎？"
}
```

### Handoff Request

```http
POST /api/handoff-requests
Content-Type: application/json
```

```json
{
  "businessSlug": "ai-gym-demo",
  "conversationId": "optional-conversation-id",
  "customer": {
    "name": "Demo 使用者",
    "phone": "0900000000"
  },
  "note": "我要真人協助"
}
```

### Admin Dashboard

```http
GET /api/admin/dashboard?businessSlug=ai-gym-demo
```

Authorization: `Bearer <token>` is required on this branch.

## 7.1 Next-Step API Contract

The next iteration adds these endpoints:

```http
POST /api/admin/login
GET /api/admin/me
POST /api/bookings/lookup
```

The detailed request / response contract is locked in `NEXT_STEP_API_CONTRACT.md`.

### Booking Lookup

```http
POST /api/bookings/lookup
Content-Type: application/json
```

```json
{
  "businessSlug": "ai-gym-demo",
  "phone": "0911111111",
  "email": "ming@example.com"
}
```

## 8. Seed 資料說明

`pnpm db:seed` 會建立：

- 1 個 business：`AI GYM Demo`
- 3 個 services
  - 一對一教練課
  - 團體燃脂課
  - 新手體驗訓練
- 2 位 staff
  - Alice 教練
  - Bob 教練
- 一組 FAQ
- 2 位 demo 客戶
- 2 筆 demo bookings
- 2 筆 demo conversations
- 1 筆 pending handoff request

如果要把 demo 狀態重置回這批資料，直接執行：

```powershell
pnpm demo:reset
```

## 9. 測試方式

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

或：

```powershell
pnpm test
```

目前測試包含：

- `/health` smoke test
- 基本 intent 判斷 smoke test

## 10. 常用指令

```powershell
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm test
pnpm lint
pnpm format
```

## 11. 本版限制與注意事項

- 排程時區優先以 `Asia/Taipei` 為 demo 預設
- 聊天是規則式流程，不是 LLM
- 後台目前是單一 env 帳密 + JWT，適合 demo / trial，不適合正式公開
- `pnpm install` 後仍需先建立資料庫與 `.env`
- 若修改根目錄 `.env`，請重新執行：
  ```powershell
  node .\scripts\sync-env.mjs
  ```

## 12. 交接文件

請直接看：

- `README.md`
- `HANDOFF.md`

`HANDOFF.md` 會補充架構、資料流、已知限制與下一步建議。
