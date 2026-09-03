-- Multi-device workstations + independent cash registers (additive).
-- Historical rows keep device_id NULL — no invented attribution.

ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CASH_REGISTER_OPEN';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CASH_REGISTER_CLOSE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CASH_REGISTER_VIEW_OWN';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CASH_REGISTER_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CASH_REGISTER_ADJUST';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CASH_REGISTER_VIEW_DIFFERENCES';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEVICES_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEVICES_MANAGE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MILL_DEVICES_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MILL_DEVICES_MANAGE';

CREATE TYPE "DeviceStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');
CREATE TYPE "DeviceWorkspace" AS ENUM ('SALES', 'MILL', 'BOTH');
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "cash_registers" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cash_registers_code_key" ON "cash_registers"("code");
CREATE INDEX "cash_registers_is_active_sort_order_idx" ON "cash_registers"("is_active", "sort_order");

CREATE TABLE "devices" (
  "id" TEXT NOT NULL,
  "installation_id" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "workspace" "DeviceWorkspace" NOT NULL DEFAULT 'BOTH',
  "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING',
  "location" TEXT,
  "notes" TEXT,
  "last_seen_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "approved_by_id" TEXT,
  "cash_register_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "devices_installation_id_key" ON "devices"("installation_id");
CREATE UNIQUE INDEX "devices_code_key" ON "devices"("code");
CREATE INDEX "devices_status_idx" ON "devices"("status");
CREATE INDEX "devices_workspace_idx" ON "devices"("workspace");
CREATE INDEX "devices_cash_register_id_idx" ON "devices"("cash_register_id");
CREATE INDEX "devices_last_seen_at_idx" ON "devices"("last_seen_at");
ALTER TABLE "devices"
  ADD CONSTRAINT "devices_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "devices_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "cash_register_sessions" (
  "id" TEXT NOT NULL,
  "season_id" TEXT NOT NULL,
  "cash_register_id" TEXT NOT NULL,
  "device_id" TEXT NOT NULL,
  "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  "opened_by_id" TEXT NOT NULL,
  "closed_by_id" TEXT,
  "opening_cash" DECIMAL(14,2) NOT NULL,
  "cash_sales" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "cash_refunds" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "cash_in" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "cash_out" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "expected_cash" DECIMAL(14,2),
  "physical_cash" DECIMAL(14,2),
  "difference" DECIMAL(14,2),
  "opening_note" TEXT,
  "closing_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cash_register_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cash_register_sessions_season_id_status_idx" ON "cash_register_sessions"("season_id", "status");
CREATE INDEX "cash_register_sessions_cash_register_id_status_idx" ON "cash_register_sessions"("cash_register_id", "status");
CREATE INDEX "cash_register_sessions_device_id_idx" ON "cash_register_sessions"("device_id");
CREATE INDEX "cash_register_sessions_opened_by_id_idx" ON "cash_register_sessions"("opened_by_id");
ALTER TABLE "cash_register_sessions"
  ADD CONSTRAINT "cash_register_sessions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "cash_register_sessions_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "cash_register_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "cash_register_sessions_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "cash_register_sessions_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
CREATE INDEX IF NOT EXISTS "clients_device_id_idx" ON "clients"("device_id");
ALTER TABLE "clients" ADD CONSTRAINT "clients_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "olive_entries" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
CREATE INDEX IF NOT EXISTS "olive_entries_device_id_idx" ON "olive_entries"("device_id");
ALTER TABLE "olive_entries" ADD CONSTRAINT "olive_entries_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pressing_records" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
CREATE INDEX IF NOT EXISTS "pressing_records_device_id_idx" ON "pressing_records"("device_id");
ALTER TABLE "pressing_records" ADD CONSTRAINT "pressing_records_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "filtration_records" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
CREATE INDEX IF NOT EXISTS "filtration_records_device_id_idx" ON "filtration_records"("device_id");
ALTER TABLE "filtration_records" ADD CONSTRAINT "filtration_records_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
CREATE INDEX IF NOT EXISTS "payments_device_id_idx" ON "payments"("device_id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "device_id" TEXT,
  ADD COLUMN IF NOT EXISTS "workspace" TEXT,
  ADD COLUMN IF NOT EXISTS "device_code" TEXT;
CREATE INDEX IF NOT EXISTS "audit_logs_device_id_idx" ON "audit_logs"("device_id");
CREATE INDEX IF NOT EXISTS "audit_logs_workspace_idx" ON "audit_logs"("workspace");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "oil_sales"
  ADD COLUMN IF NOT EXISTS "device_id" TEXT,
  ADD COLUMN IF NOT EXISTS "cash_register_id" TEXT,
  ADD COLUMN IF NOT EXISTS "cash_session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "device_code" TEXT,
  ADD COLUMN IF NOT EXISTS "device_name" TEXT,
  ADD COLUMN IF NOT EXISTS "cash_register_code" TEXT,
  ADD COLUMN IF NOT EXISTS "cash_register_name" TEXT;
CREATE INDEX IF NOT EXISTS "oil_sales_device_id_idx" ON "oil_sales"("device_id");
CREATE INDEX IF NOT EXISTS "oil_sales_cash_register_id_idx" ON "oil_sales"("cash_register_id");
CREATE INDEX IF NOT EXISTS "oil_sales_cash_session_id_idx" ON "oil_sales"("cash_session_id");
ALTER TABLE "oil_sales"
  ADD CONSTRAINT "oil_sales_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_sales_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_sales_cash_session_id_fkey" FOREIGN KEY ("cash_session_id") REFERENCES "cash_register_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "cash_register_sessions_one_open_idx"
  ON "cash_register_sessions"("cash_register_id")
  WHERE "status" = 'OPEN';
