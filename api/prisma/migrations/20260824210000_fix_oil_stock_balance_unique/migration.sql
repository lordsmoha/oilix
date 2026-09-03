-- Repair: original oil_stock_balances unique was a UNIQUE INDEX (not a CONSTRAINT).
-- The prior migration used DROP CONSTRAINT only, so (season_id, oil_type) remained and
-- blocked creating FARMER rows when STORED rows already existed for the same oil type.

DROP INDEX IF EXISTS "oil_stock_balances_season_id_oil_type_key";
ALTER TABLE "oil_stock_balances" DROP CONSTRAINT IF EXISTS "oil_stock_balances_season_id_oil_type_key";

CREATE UNIQUE INDEX IF NOT EXISTS "oil_stock_balances_season_id_oil_source_oil_type_key"
  ON "oil_stock_balances"("season_id", "oil_source", "oil_type");
