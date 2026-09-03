-- Oil Source dimension + extend OilType (DROU, ZEBBOUCHE)
-- Existing data migrates to STORED source (safe default).

CREATE TYPE "OilSource" AS ENUM ('STORED', 'FARMER');

ALTER TYPE "OilType" ADD VALUE IF NOT EXISTS 'DROU';
ALTER TYPE "OilType" ADD VALUE IF NOT EXISTS 'ZEBBOUCHE';

-- oil_stock_balances: add source, replace unique key
ALTER TABLE "oil_stock_balances" ADD COLUMN IF NOT EXISTS "oil_source" "OilSource" NOT NULL DEFAULT 'STORED';
DROP INDEX IF EXISTS "oil_stock_balances_season_id_oil_type_key";
ALTER TABLE "oil_stock_balances" DROP CONSTRAINT IF EXISTS "oil_stock_balances_season_id_oil_type_key";
CREATE UNIQUE INDEX IF NOT EXISTS "oil_stock_balances_season_id_oil_source_oil_type_key"
  ON "oil_stock_balances"("season_id", "oil_source", "oil_type");
CREATE INDEX IF NOT EXISTS "oil_stock_balances_season_id_oil_source_idx" ON "oil_stock_balances"("season_id", "oil_source");

-- oil_stock_movements
ALTER TABLE "oil_stock_movements" ADD COLUMN "oil_source" "OilSource" NOT NULL DEFAULT 'STORED';
DROP INDEX IF EXISTS "oil_stock_movements_season_id_oil_type_created_at_idx";
CREATE INDEX "oil_stock_movements_season_id_oil_source_oil_type_created_at_idx"
  ON "oil_stock_movements"("season_id", "oil_source", "oil_type", "created_at");

-- oil_inventory_counts
ALTER TABLE "oil_inventory_counts" ADD COLUMN "oil_source" "OilSource" NOT NULL DEFAULT 'STORED';
DROP INDEX IF EXISTS "oil_inventory_counts_season_id_oil_type_created_at_idx";
CREATE INDEX "oil_inventory_counts_season_id_oil_source_oil_type_created_at_idx"
  ON "oil_inventory_counts"("season_id", "oil_source", "oil_type", "created_at");

-- oil_sales + items
ALTER TABLE "oil_sales" ADD COLUMN "oil_source" "OilSource";
ALTER TABLE "oil_sale_items" ADD COLUMN "oil_source" "OilSource";

UPDATE "oil_sales" SET "oil_source" = 'STORED' WHERE "oil_type" IS NOT NULL AND "oil_source" IS NULL;
UPDATE "oil_sale_items" SET "oil_source" = 'STORED' WHERE "oil_type" IS NOT NULL AND "oil_source" IS NULL;

CREATE INDEX "oil_sales_season_id_oil_source_oil_type_idx" ON "oil_sales"("season_id", "oil_source", "oil_type");
CREATE INDEX "oil_sale_items_oil_source_oil_type_idx" ON "oil_sale_items"("oil_source", "oil_type");
