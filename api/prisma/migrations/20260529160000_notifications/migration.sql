-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "source" TEXT DEFAULT 'web';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "season_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_read_created_at_idx" ON "notifications"("read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_season_id_idx" ON "notifications"("season_id");
