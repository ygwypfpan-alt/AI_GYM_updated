# HANDOFF

## 1. 這個 MVP 現在能做什麼

### 使用者端

- 透過網站聊天詢問 FAQ
- 透過聊天查詢可預約時段
- 直接點選時段建立預約
- 建立後可在同一頁改期或取消
- 可用 phone + email 查詢自己的預約
- 可從查詢結果直接改期或取消
- 可建立轉真人請求

### 管理端

- `/admin` 可查看：
  - bookings
  - faq_items
  - conversations
  - handoff_requests
- `/admin` 現在有最小登入保護

## 2. 核心資料流

### FAQ

1. 前端送 `POST /api/chat/message`
2. API 做規則式 intent 判斷
3. 若為 FAQ，走 `searchFaqItems`
4. 回傳 FAQ matches 給聊天視窗顯示

### 查時段

1. 前端送 `POST /api/chat/message`
2. API 偵測服務名稱與 availability intent
3. API 走 `getAvailability`
4. 回傳 slot 清單
5. 前端將 slot 渲染成可點選按鈕

### 建立預約

1. 前端點 slot
2. 送 `POST /api/bookings`
3. API 會：
   - 檢查 service
   - 建立或更新 customer
   - 驗證 slot 是否仍可預約
   - 建立 booking
4. 前端更新目前預約卡片

### 改期

1. 前端點「改期」
2. 重新查 availability
3. 點新 slot
4. 送 `PATCH /api/bookings/:id/reschedule`

### 查詢我的預約

1. 前端送 `POST /api/bookings/lookup`
2. API 以 `phone + email` 尋找 customer
3. API 回傳對應 booking 清單
4. 前端可直接從清單觸發改期或取消

### Admin 登入

1. 前端送 `POST /api/admin/login`
2. API 以 `.env` 中的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 驗證
3. API 回傳 JWT token
4. 前端將 token 存在 localStorage
5. 後續打 `/api/admin/*` 帶 `Authorization: Bearer <token>`

### 取消

1. 前端點「取消預約」
2. 送 `PATCH /api/bookings/:id/cancel`

### 轉真人

1. 前端聊天或按快捷鈕
2. 送 `POST /api/handoff-requests`
3. API 建立 handoff request 並把 conversation 狀態改成 `HANDED_OFF`

## 3. 規則式聊天邏輯

目前沒有外部 LLM。

### intent 判斷檔案

- `apps/api/src/lib/intent.ts`

### 服務名稱比對

- `apps/api/src/lib/matchers.ts`

### 聊天主流程

- `apps/api/src/services/chat-service.ts`

做法很簡單：

- 關鍵字判斷 FAQ / availability / booking / reschedule / cancel / handoff
- 嘗試從訊息裡抓 service name
- 找 FAQ 或查時段
- 回傳 quickReplies / FAQ cards / slot buttons

## 4. 資料表說明

Prisma schema 在：

- `packages/db/prisma/schema.prisma`

主要模型：

- businesses
- customers
- services
- staff
- availability_rules
- bookings
- conversations
- messages
- faq_items
- handoff_requests

## 5. 重要檔案

### API

- `apps/api/src/app.ts`
- `apps/api/src/routes/*`
- `apps/api/src/services/*`

### Web

- `apps/web/app/page.tsx`
- `apps/web/app/admin/page.tsx`
- `apps/web/components/chat-widget.tsx`
- `apps/web/components/admin-dashboard.tsx`
- `apps/web/components/admin-shell.tsx`
- `apps/web/components/admin-login.tsx`
- `apps/web/components/my-bookings.tsx`

### DB

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/202603090001_init/migration.sql`
- `packages/db/prisma/seed.ts`

### Scripts

- `scripts/setup.ps1`
- `scripts/dev.ps1`
- `scripts/test.ps1`
- `scripts/sync-env.mjs`

## 6. 已知限制

1. 時區目前以 `Asia/Taipei` 為主做 demo
2. 聊天不會做自然語言深度理解
3. admin 只有單一 env 帳密 + JWT，僅適合本機展示
4. 沒有做多館、多分店進階規則
5. availability rule 還是 MVP 等級，不是完整排班系統
6. 沒有處理付款、通知、提醒、日曆同步

## 7. 下一步建議（不影響本次 demo）

### 第一優先

- 把聊天的改期 / 取消做成更完整的對話式流程
- 把 availability rule 擴充成例外日 / 休館日 / staff 休假
- 為 admin 補上更安全的正式 auth 方案

### 第二優先

- 增加服務 / FAQ / staff 的 CRUD
- 增加更完整測試：
  - booking happy path
  - reschedule happy path
  - cancel happy path
  - handoff happy path

### 第三優先

- 串接通知
- 串接真實客服系統
- 部署到正式環境

## 8. 新接手者快速上手

1. 看 `README.md`
2. 先建立 `.env`
3. 先建立 PostgreSQL 資料庫
4. 跑 `PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
5. 跑 `PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1`
6. 先在首頁走一遍 demo 流程
7. 再到 `/admin` 驗證資料是否正確寫入

## 9. 如果你要重置 demo 資料

目前最簡單做法：

1. 手動清空資料庫或重建 `ai_gym`
2. 再執行：
   - `pnpm db:migrate`
   - `pnpm db:seed`

因為本版以最短 demo 路徑為主，暫時沒有再包一層 reset 指令。
