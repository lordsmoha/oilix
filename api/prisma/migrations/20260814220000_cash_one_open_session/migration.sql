-- One OPEN cash session per register (DB-level race protection).
-- Additive / non-destructive. Close duplicate OPEN sessions before applying if any exist.

CREATE UNIQUE INDEX IF NOT EXISTS cash_register_sessions_one_open_per_register
ON "cash_register_sessions" ("cash_register_id")
WHERE "status" = 'OPEN';
