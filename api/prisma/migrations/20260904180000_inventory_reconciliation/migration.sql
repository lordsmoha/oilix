-- Inventory reconciliation: physical count becomes new current (theoretical) stock.

ALTER TYPE "OilStockMovementType" ADD VALUE IF NOT EXISTS 'INVENTORY_ADJUSTMENT';
ALTER TYPE "OilContainerStockMovementType" ADD VALUE IF NOT EXISTS 'INVENTORY_ADJUSTMENT';

DO $$ BEGIN
  CREATE TYPE "OilInventoryDifferenceType" AS ENUM ('LOSS', 'SURPLUS', 'BALANCED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "oil_inventory_counts"
  ADD COLUMN IF NOT EXISTS "difference_type" "OilInventoryDifferenceType" NOT NULL DEFAULT 'BALANCED',
  ADD COLUMN IF NOT EXISTS "surplus_qty" DECIMAL(14,2) NOT NULL DEFAULT 0;

UPDATE "oil_inventory_counts"
SET
  "difference_type" = CASE
    WHEN "loss_qty" > 0 THEN 'LOSS'::"OilInventoryDifferenceType"
    WHEN "difference" > 0 THEN 'SURPLUS'::"OilInventoryDifferenceType"
    ELSE 'BALANCED'::"OilInventoryDifferenceType"
  END,
  "surplus_qty" = CASE WHEN "difference" > 0 THEN "difference" ELSE 0 END
WHERE "surplus_qty" = 0 AND ("loss_qty" > 0 OR "difference" <> 0);

ALTER TABLE "oil_container_inventory_counts"
  ADD COLUMN IF NOT EXISTS "difference_type" "OilInventoryDifferenceType" NOT NULL DEFAULT 'BALANCED',
  ADD COLUMN IF NOT EXISTS "surplus_qty" INTEGER NOT NULL DEFAULT 0;

UPDATE "oil_container_inventory_counts"
SET
  "difference_type" = CASE
    WHEN "loss_qty" > 0 THEN 'LOSS'::"OilInventoryDifferenceType"
    WHEN "difference" > 0 THEN 'SURPLUS'::"OilInventoryDifferenceType"
    ELSE 'BALANCED'::"OilInventoryDifferenceType"
  END,
  "surplus_qty" = CASE WHEN "difference" > 0 THEN "difference" ELSE 0 END
WHERE "surplus_qty" = 0 AND ("loss_qty" > 0 OR "difference" <> 0);
