-- Assistance per litre (مساعدة اللتر) on oil sales.
-- Additive: existing rows keep 0; historical fixed/% amounts unchanged.

ALTER TABLE "oil_sales"
  ADD COLUMN IF NOT EXISTS "assistance_per_litre" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "assistance_per_litre_total" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Optional scoped permission (safe if already present)
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_ASSISTANCE_PER_LITRE';
