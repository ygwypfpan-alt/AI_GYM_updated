CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'HANDED_OFF', 'CLOSED');
CREATE TYPE "ConversationChannel" AS ENUM ('WEB_CHAT');
CREATE TYPE "MessageSender" AS ENUM ('USER', 'BOT', 'STAFF', 'SYSTEM');
CREATE TYPE "HandoffStatus" AS ENUM ('PENDING', 'RESOLVED');

CREATE TABLE "businesses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "services" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "durationMinutes" INTEGER NOT NULL,
  "price" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "bio" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "availability_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "serviceId" UUID,
  "staffId" UUID,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "customerId" UUID,
  "channel" "ConversationChannel" NOT NULL DEFAULT 'WEB_CHAT',
  "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "customerId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "staffId" UUID,
  "conversationId" UUID,
  "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "notes" TEXT,
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL,
  "sender" "MessageSender" NOT NULL,
  "text" TEXT NOT NULL,
  "intent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "faq_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "category" TEXT,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "handoff_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "businessId" UUID NOT NULL,
  "customerId" UUID,
  "conversationId" UUID,
  "status" "HandoffStatus" NOT NULL DEFAULT 'PENDING',
  "name" TEXT,
  "phone" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "handoff_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");
CREATE INDEX "customers_businessId_phone_idx" ON "customers"("businessId", "phone");
CREATE INDEX "customers_businessId_email_idx" ON "customers"("businessId", "email");
CREATE INDEX "availability_rules_businessId_dayOfWeek_idx" ON "availability_rules"("businessId", "dayOfWeek");
CREATE INDEX "bookings_businessId_startAt_idx" ON "bookings"("businessId", "startAt");
CREATE INDEX "bookings_customerId_status_idx" ON "bookings"("customerId", "status");
CREATE INDEX "conversations_businessId_status_idx" ON "conversations"("businessId", "status");
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
CREATE INDEX "faq_items_businessId_isActive_idx" ON "faq_items"("businessId", "isActive");
CREATE INDEX "handoff_requests_businessId_status_idx" ON "handoff_requests"("businessId", "status");

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "services"
  ADD CONSTRAINT "services_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "staff"
  ADD CONSTRAINT "staff_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_rules"
  ADD CONSTRAINT "availability_rules_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_rules"
  ADD CONSTRAINT "availability_rules_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_rules"
  ADD CONSTRAINT "availability_rules_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "staff"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "staff"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "faq_items"
  ADD CONSTRAINT "faq_items_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "handoff_requests"
  ADD CONSTRAINT "handoff_requests_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "handoff_requests"
  ADD CONSTRAINT "handoff_requests_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "handoff_requests"
  ADD CONSTRAINT "handoff_requests_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
