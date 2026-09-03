-- Numérotation client indépendante par type d'olive (même saison).
-- Exécuter ensuite : npx ts-node prisma/scripts/migrate-clients-per-olive-type.ts

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "olive_type" "OliveType";

DROP INDEX IF EXISTS "clients_season_id_client_number_key";

CREATE INDEX IF NOT EXISTS "clients_season_id_olive_type_idx" ON "clients"("season_id", "olive_type");
