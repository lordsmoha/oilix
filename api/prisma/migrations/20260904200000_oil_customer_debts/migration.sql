-- Customer debt / credit for oil sales

ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_ALLOW_DEBT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEBTS_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEBTS_RECORD_PAYMENT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEBTS_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEBTS_ADJUST';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DEBTS_EXPORT';

DO $$ BEGIN
  CREATE TYPE "OilSalePaymentStatus" AS ENUM ('PAID', 'PARTIALLY_PAID', 'UNPAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OilCustomerLedgerType" AS ENUM (
    'SALE_DEBT', 'PAYMENT', 'REFUND', 'SALE_CANCELLATION', 'DEBT_ADJUSTMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "oil_sales"
  ADD COLUMN IF NOT EXISTS "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "remaining_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payment_status" "OilSalePaymentStatus" NOT NULL DEFAULT 'PAID';

-- Historical completed sales treated as fully paid
UPDATE "oil_sales"
SET
  "amount_paid" = "final_amount",
  "remaining_amount" = 0,
  "payment_status" = 'PAID'
WHERE "status" = 'COMPLETED'
  AND "amount_paid" = 0
  AND "remaining_amount" = 0
  AND "final_amount" > 0;

CREATE INDEX IF NOT EXISTS "oil_sales_payment_status_idx" ON "oil_sales"("payment_status");

CREATE TABLE IF NOT EXISTS "oil_sale_payments" (
  "id" TEXT NOT NULL,
  "season_id" TEXT NOT NULL,
  "receipt_number" INTEGER NOT NULL,
  "customer_id" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "payment_method" TEXT NOT NULL DEFAULT 'CASH',
  "reference" TEXT,
  "notes" TEXT,
  "user_id" TEXT NOT NULL,
  "device_id" TEXT,
  "cash_register_id" TEXT,
  "cash_session_id" TEXT,
  "device_code" TEXT,
  "device_name" TEXT,
  "cash_register_code" TEXT,
  "cash_register_name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oil_sale_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "oil_sale_payments_season_id_receipt_number_key"
  ON "oil_sale_payments"("season_id", "receipt_number");
CREATE INDEX IF NOT EXISTS "oil_sale_payments_season_id_customer_id_created_at_idx"
  ON "oil_sale_payments"("season_id", "customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "oil_sale_payments_user_id_idx" ON "oil_sale_payments"("user_id");
CREATE INDEX IF NOT EXISTS "oil_sale_payments_cash_session_id_idx" ON "oil_sale_payments"("cash_session_id");

CREATE TABLE IF NOT EXISTS "oil_sale_payment_allocations" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "sale_id" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oil_sale_payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "oil_sale_payment_allocations_payment_id_idx"
  ON "oil_sale_payment_allocations"("payment_id");
CREATE INDEX IF NOT EXISTS "oil_sale_payment_allocations_sale_id_idx"
  ON "oil_sale_payment_allocations"("sale_id");

CREATE TABLE IF NOT EXISTS "oil_customer_ledger_entries" (
  "id" TEXT NOT NULL,
  "season_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "type" "OilCustomerLedgerType" NOT NULL,
  "sale_id" TEXT,
  "payment_id" TEXT,
  "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "balance_after" DECIMAL(14,2) NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "user_id" TEXT NOT NULL,
  "device_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oil_customer_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "oil_customer_ledger_entries_season_id_customer_id_created_at_idx"
  ON "oil_customer_ledger_entries"("season_id", "customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "oil_customer_ledger_entries_sale_id_idx" ON "oil_customer_ledger_entries"("sale_id");
CREATE INDEX IF NOT EXISTS "oil_customer_ledger_entries_payment_id_idx" ON "oil_customer_ledger_entries"("payment_id");
CREATE INDEX IF NOT EXISTS "oil_customer_ledger_entries_user_id_idx" ON "oil_customer_ledger_entries"("user_id");

DO $$ BEGIN
  ALTER TABLE "oil_sale_payments" ADD CONSTRAINT "oil_sale_payments_season_id_fkey"
    FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_sale_payments" ADD CONSTRAINT "oil_sale_payments_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "oil_sale_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_sale_payments" ADD CONSTRAINT "oil_sale_payments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_sale_payments" ADD CONSTRAINT "oil_sale_payments_device_id_fkey"
    FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_sale_payments" ADD CONSTRAINT "oil_sale_payments_cash_register_id_fkey"
    FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_sale_payments" ADD CONSTRAINT "oil_sale_payments_cash_session_id_fkey"
    FOREIGN KEY ("cash_session_id") REFERENCES "cash_register_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "oil_sale_payment_allocations" ADD CONSTRAINT "oil_sale_payment_allocations_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "oil_sale_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_sale_payment_allocations" ADD CONSTRAINT "oil_sale_payment_allocations_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "oil_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "oil_customer_ledger_entries" ADD CONSTRAINT "oil_customer_ledger_entries_season_id_fkey"
    FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_customer_ledger_entries" ADD CONSTRAINT "oil_customer_ledger_entries_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "oil_sale_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_customer_ledger_entries" ADD CONSTRAINT "oil_customer_ledger_entries_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "oil_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_customer_ledger_entries" ADD CONSTRAINT "oil_customer_ledger_entries_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "oil_sale_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_customer_ledger_entries" ADD CONSTRAINT "oil_customer_ledger_entries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "oil_customer_ledger_entries" ADD CONSTRAINT "oil_customer_ledger_entries_device_id_fkey"
    FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
