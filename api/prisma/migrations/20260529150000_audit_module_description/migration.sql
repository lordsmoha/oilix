ALTER TABLE "audit_logs" ADD COLUMN "module" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "audit_logs" ADD COLUMN "description" TEXT;

CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
