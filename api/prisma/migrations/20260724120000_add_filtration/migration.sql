-- AlterEnum
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'FILTRATION_READ';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'FILTRATION_WRITE';

-- CreateTable
CREATE TABLE IF NOT EXISTS "filtration_records" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "reference_number" INTEGER NOT NULL,
    "zayat_name" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT '',
    "quantity_l" DECIMAL(12,2) NOT NULL,
    "khallaf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "filtration_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "filtration_records_season_id_reference_number_key" ON "filtration_records"("season_id", "reference_number");
CREATE INDEX IF NOT EXISTS "filtration_records_season_id_idx" ON "filtration_records"("season_id");
CREATE INDEX IF NOT EXISTS "filtration_records_zayat_name_idx" ON "filtration_records"("zayat_name");
CREATE INDEX IF NOT EXISTS "filtration_records_region_idx" ON "filtration_records"("region");
CREATE INDEX IF NOT EXISTS "filtration_records_created_at_idx" ON "filtration_records"("created_at");
CREATE INDEX IF NOT EXISTS "filtration_records_deleted_at_idx" ON "filtration_records"("deleted_at");

DO $$ BEGIN
 ALTER TABLE "filtration_records" ADD CONSTRAINT "filtration_records_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "filtration_records" ADD CONSTRAINT "filtration_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "filtration_records" ADD CONSTRAINT "filtration_records_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
