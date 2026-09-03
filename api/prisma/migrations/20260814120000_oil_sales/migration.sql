-- AlterEnum Permission
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_READ';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_WRITE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CANCEL';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_STOCK_WRITE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_INVENTORY_WRITE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_CUSTOMERS_WRITE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SETTINGS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_OVERRIDE';

-- CreateEnum
CREATE TYPE "OilType" AS ENUM ('GREEN', 'TAIEB');
CREATE TYPE "OilStockMovementType" AS ENUM ('STOCK_ADDITION', 'SALE', 'SALE_CANCELLATION', 'INVENTORY_COUNT', 'ADJUSTMENT', 'LOSS', 'MANUAL_CORRECTION');
CREATE TYPE "OilSaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "oil_sale_customers" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "wilaya" TEXT,
    "commune" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "oil_sale_customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oil_stock_balances" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "oil_type" "OilType" NOT NULL,
    "total_added" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_sold" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "theoretical_qty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "physical_qty" DECIMAL(14,2),
    "last_inventory_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oil_stock_balances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oil_inventory_counts" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "oil_type" "OilType" NOT NULL,
    "theoretical_before" DECIMAL(14,2) NOT NULL,
    "physical_qty" DECIMAL(14,2) NOT NULL,
    "difference" DECIMAL(14,2) NOT NULL,
    "loss_qty" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oil_inventory_counts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oil_sales" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "receipt_number" INTEGER NOT NULL,
    "customer_id" TEXT NOT NULL,
    "oil_type" "OilType" NOT NULL,
    "quantity_l" DECIMAL(14,2) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "assistance_fixed" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "assistance_percent" DECIMAL(7,3) NOT NULL DEFAULT 0,
    "assistance_percent_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_assistance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(14,2) NOT NULL,
    "status" "OilSaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "override_stock" BOOLEAN NOT NULL DEFAULT false,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sale_time" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oil_sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oil_stock_movements" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "oil_type" "OilType" NOT NULL,
    "type" "OilStockMovementType" NOT NULL,
    "quantity_l" DECIMAL(14,2) NOT NULL,
    "stock_before" DECIMAL(14,2) NOT NULL,
    "stock_after" DECIMAL(14,2) NOT NULL,
    "sale_id" TEXT,
    "inventory_count_id" TEXT,
    "note" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oil_stock_movements_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE UNIQUE INDEX "oil_stock_balances_season_id_oil_type_key" ON "oil_stock_balances"("season_id", "oil_type");
CREATE UNIQUE INDEX "oil_sales_season_id_receipt_number_key" ON "oil_sales"("season_id", "receipt_number");

CREATE INDEX "oil_sale_customers_season_id_idx" ON "oil_sale_customers"("season_id");
CREATE INDEX "oil_sale_customers_name_idx" ON "oil_sale_customers"("name");
CREATE INDEX "oil_sale_customers_phone_idx" ON "oil_sale_customers"("phone");
CREATE INDEX "oil_sale_customers_deleted_at_idx" ON "oil_sale_customers"("deleted_at");
CREATE INDEX "oil_stock_balances_season_id_idx" ON "oil_stock_balances"("season_id");
CREATE INDEX "oil_stock_movements_season_id_oil_type_created_at_idx" ON "oil_stock_movements"("season_id", "oil_type", "created_at");
CREATE INDEX "oil_stock_movements_type_idx" ON "oil_stock_movements"("type");
CREATE INDEX "oil_stock_movements_sale_id_idx" ON "oil_stock_movements"("sale_id");
CREATE INDEX "oil_stock_movements_inventory_count_id_idx" ON "oil_stock_movements"("inventory_count_id");
CREATE INDEX "oil_stock_movements_user_id_idx" ON "oil_stock_movements"("user_id");
CREATE INDEX "oil_inventory_counts_season_id_oil_type_created_at_idx" ON "oil_inventory_counts"("season_id", "oil_type", "created_at");
CREATE INDEX "oil_inventory_counts_user_id_idx" ON "oil_inventory_counts"("user_id");
CREATE INDEX "oil_sales_season_id_oil_type_idx" ON "oil_sales"("season_id", "oil_type");
CREATE INDEX "oil_sales_season_id_sale_date_idx" ON "oil_sales"("season_id", "sale_date");
CREATE INDEX "oil_sales_customer_id_idx" ON "oil_sales"("customer_id");
CREATE INDEX "oil_sales_status_idx" ON "oil_sales"("status");
CREATE INDEX "oil_sales_created_by_id_idx" ON "oil_sales"("created_by_id");
CREATE INDEX "oil_sales_receipt_number_idx" ON "oil_sales"("receipt_number");

-- FKs
ALTER TABLE "oil_sale_customers" ADD CONSTRAINT "oil_sale_customers_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_sale_customers" ADD CONSTRAINT "oil_sale_customers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oil_stock_balances" ADD CONSTRAINT "oil_stock_balances_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_inventory_counts" ADD CONSTRAINT "oil_inventory_counts_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_inventory_counts" ADD CONSTRAINT "oil_inventory_counts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_sales" ADD CONSTRAINT "oil_sales_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_sales" ADD CONSTRAINT "oil_sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "oil_sale_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_sales" ADD CONSTRAINT "oil_sales_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_sales" ADD CONSTRAINT "oil_sales_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "oil_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_inventory_count_id_fkey" FOREIGN KEY ("inventory_count_id") REFERENCES "oil_inventory_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
