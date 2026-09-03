-- Container products become an independent unit-based inventory domain.

ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINERS_SELL';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINERS_CHANGE_PRICE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINER_STOCK_VIEW';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINER_STOCK_ADD';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINER_STOCK_ADJUST';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINER_STOCK_INVENTORY';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINER_STOCK_LOSS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_CONTAINER_STOCK_OVERRIDE';

ALTER TYPE "OilSaleLineKind" ADD VALUE IF NOT EXISTS 'CONTAINER_ONLY';

CREATE TYPE "OilContainerStockMovementType" AS ENUM (
  'PURCHASE',
  'STOCK_ADDITION',
  'OIL_SALE_CONSUMPTION',
  'DIRECT_CONTAINER_SALE',
  'SALE_CANCELLATION',
  'INVENTORY_COUNT',
  'DAMAGE',
  'LOSS',
  'ADJUSTMENT',
  'MANUAL_CORRECTION'
);

ALTER TABLE "oil_containers"
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "min_stock" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "oil_sales"
  ALTER COLUMN "oil_type" DROP NOT NULL,
  ALTER COLUMN "quantity_l" SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "override_container_stock" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "oil_sale_items"
  ALTER COLUMN "oil_type" DROP NOT NULL,
  ALTER COLUMN "quantity_l" SET DEFAULT 0;

CREATE TABLE "oil_container_stock_balances" (
  "id" TEXT NOT NULL,
  "season_id" TEXT NOT NULL,
  "container_id" TEXT NOT NULL,
  "total_added" INTEGER NOT NULL DEFAULT 0,
  "total_sold_empty" INTEGER NOT NULL DEFAULT 0,
  "total_consumed_in_oil" INTEGER NOT NULL DEFAULT 0,
  "total_damaged" INTEGER NOT NULL DEFAULT 0,
  "theoretical_qty" INTEGER NOT NULL DEFAULT 0,
  "physical_qty" INTEGER,
  "last_inventory_at" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "oil_container_stock_balances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oil_container_stock_balances_season_id_container_id_key"
  ON "oil_container_stock_balances"("season_id", "container_id");
CREATE INDEX "oil_container_stock_balances_season_id_idx" ON "oil_container_stock_balances"("season_id");
CREATE INDEX "oil_container_stock_balances_container_id_idx" ON "oil_container_stock_balances"("container_id");

ALTER TABLE "oil_container_stock_balances"
  ADD CONSTRAINT "oil_container_stock_balances_season_id_fkey"
    FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_stock_balances_container_id_fkey"
    FOREIGN KEY ("container_id") REFERENCES "oil_containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "oil_container_inventory_counts" (
  "id" TEXT NOT NULL,
  "season_id" TEXT NOT NULL,
  "container_id" TEXT NOT NULL,
  "theoretical_before" INTEGER NOT NULL,
  "physical_qty" INTEGER NOT NULL,
  "difference" INTEGER NOT NULL,
  "loss_qty" INTEGER NOT NULL,
  "note" TEXT,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oil_container_inventory_counts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oil_container_inventory_counts_season_id_container_id_created_at_idx"
  ON "oil_container_inventory_counts"("season_id", "container_id", "created_at");
CREATE INDEX "oil_container_inventory_counts_user_id_idx" ON "oil_container_inventory_counts"("user_id");

ALTER TABLE "oil_container_inventory_counts"
  ADD CONSTRAINT "oil_container_inventory_counts_season_id_fkey"
    FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_inventory_counts_container_id_fkey"
    FOREIGN KEY ("container_id") REFERENCES "oil_containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_inventory_counts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "oil_container_stock_movements" (
  "id" TEXT NOT NULL,
  "season_id" TEXT NOT NULL,
  "container_id" TEXT NOT NULL,
  "type" "OilContainerStockMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "stock_before" INTEGER NOT NULL,
  "stock_after" INTEGER NOT NULL,
  "unit_cost" DECIMAL(14,2),
  "sale_id" TEXT,
  "inventory_count_id" TEXT,
  "note" TEXT,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oil_container_stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oil_container_stock_movements_season_id_container_id_created_at_idx"
  ON "oil_container_stock_movements"("season_id", "container_id", "created_at");
CREATE INDEX "oil_container_stock_movements_type_idx" ON "oil_container_stock_movements"("type");
CREATE INDEX "oil_container_stock_movements_sale_id_idx" ON "oil_container_stock_movements"("sale_id");
CREATE INDEX "oil_container_stock_movements_inventory_count_id_idx" ON "oil_container_stock_movements"("inventory_count_id");
CREATE INDEX "oil_container_stock_movements_user_id_idx" ON "oil_container_stock_movements"("user_id");

ALTER TABLE "oil_container_stock_movements"
  ADD CONSTRAINT "oil_container_stock_movements_season_id_fkey"
    FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_stock_movements_container_id_fkey"
    FOREIGN KEY ("container_id") REFERENCES "oil_containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_stock_movements_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "oil_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_stock_movements_inventory_count_id_fkey"
    FOREIGN KEY ("inventory_count_id") REFERENCES "oil_container_inventory_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "oil_container_stock_movements_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "oil_sale_items_kind_idx" ON "oil_sale_items"("kind");
