-- Clients are scoped per season (new season = empty client list, numbering from 1).

ALTER TABLE "clients" ADD COLUMN "season_id" TEXT;

-- Default: season of the client's most recent olive entry, else active season.
UPDATE "clients" c
SET "season_id" = COALESCE(
  (
    SELECT oe."season_id"
    FROM "olive_entries" oe
    WHERE oe."client_id" = c."id" AND oe."deleted_at" IS NULL
    ORDER BY oe."entry_date" DESC
    LIMIT 1
  ),
  (
    SELECT s."id"
    FROM "seasons" s
    WHERE s."is_active" = true
    ORDER BY s."start_date" DESC
    LIMIT 1
  )
);

ALTER TABLE "clients" ALTER COLUMN "season_id" SET NOT NULL;

ALTER TABLE "clients" ADD CONSTRAINT "clients_season_id_fkey"
  FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "clients_client_number_key";

CREATE UNIQUE INDEX "clients_season_id_client_number_key" ON "clients"("season_id", "client_number");

CREATE INDEX "clients_season_id_idx" ON "clients"("season_id");
