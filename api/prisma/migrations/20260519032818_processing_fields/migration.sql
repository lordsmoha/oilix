-- AlterEnum
ALTER TYPE "EntryStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "olive_entries" ADD COLUMN     "is_non_referential" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes2" TEXT;

-- AlterTable
ALTER TABLE "pressing_records" ADD COLUMN     "notes2" TEXT,
ADD COLUMN     "pickup_date" TIMESTAMP(3);
