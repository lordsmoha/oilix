-- Granular permissions
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MILL_ACCESS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_ACCESS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_DASHBOARD_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_CREATE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_EDIT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_DELETE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_REPRINT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_CHANGE_PRICE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_ASSISTANCE_FIXED';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_ASSISTANCE_PERCENT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_ASSISTANCE_MODIFY';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_ASSISTANCE_TOTALS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_STOCK_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_STOCK_ADD';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_STOCK_ADJUST';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_STOCK_LOSS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_STOCK_OVERRIDE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_INVENTORY_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_INVENTORY_CREATE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CUSTOMERS_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CUSTOMERS_CREATE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CUSTOMERS_EDIT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CUSTOMERS_DELETE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINERS_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINERS_CREATE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINERS_EDIT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINERS_DELETE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_REPORTS_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_REPORTS_EXPORT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_PRINT_RECEIPT';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SETTINGS_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SETTINGS_EDIT';

CREATE TYPE "OilSaleLineKind" AS ENUM ('CONTAINER', 'LOOSE');
CREATE TYPE "OilPricingMode" AS ENUM ('PER_LITRE', 'FIXED_CONTAINER');

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[];

CREATE TABLE "oil_containers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity_l" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "unit_price" DECIMAL(14,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "oil_containers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oil_containers_is_active_sort_order_idx" ON "oil_containers"("is_active", "sort_order");
CREATE INDEX "oil_containers_deleted_at_idx" ON "oil_containers"("deleted_at");

CREATE TABLE "oil_sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "oil_type" "OilType" NOT NULL,
    "kind" "OilSaleLineKind" NOT NULL,
    "pricing_mode" "OilPricingMode" NOT NULL DEFAULT 'PER_LITRE',
    "container_id" TEXT,
    "container_name" TEXT,
    "container_capacity_l" DECIMAL(12,2),
    "container_count" INTEGER,
    "quantity_l" DECIMAL(14,2) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "container_price" DECIMAL(14,2),
    "line_gross" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oil_sale_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oil_sale_items_sale_id_idx" ON "oil_sale_items"("sale_id");
CREATE INDEX "oil_sale_items_container_id_idx" ON "oil_sale_items"("container_id");
CREATE INDEX "oil_sale_items_oil_type_idx" ON "oil_sale_items"("oil_type");

ALTER TABLE "oil_sale_items" ADD CONSTRAINT "oil_sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "oil_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oil_sale_items" ADD CONSTRAINT "oil_sale_items_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "oil_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "oil_containers" ("id", "name", "capacity_l", "is_active", "sort_order", "updated_at")
VALUES
  (gen_random_uuid()::text, 'Bidon 2L', 2, true, 10, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Bidon 5L', 5, true, 20, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Bidon 30L', 30, true, 30, CURRENT_TIMESTAMP);
