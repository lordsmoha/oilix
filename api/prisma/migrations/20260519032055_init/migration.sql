-- CreateEnum
CREATE TYPE "OliveType" AS ENUM ('GREEN', 'RIPE', 'ZBOUCH');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('RECEIVED', 'IN_STORAGE', 'PRESSED', 'OIL_COLLECTED', 'PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('USERS_READ', 'USERS_WRITE', 'CLIENTS_READ', 'CLIENTS_WRITE', 'OLIVE_READ', 'OLIVE_WRITE', 'PRESSING_READ', 'PRESSING_WRITE', 'FINANCE_READ', 'FINANCE_WRITE', 'SETTINGS_READ', 'SETTINGS_WRITE', 'REPORTS_READ', 'AUDIT_READ', 'BACKUP_RESTORE');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "permissions" "Permission"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "client_number" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "olive_entries" (
    "id" TEXT NOT NULL,
    "reference_number" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "olive_type" "OliveType" NOT NULL,
    "bag_count" INTEGER NOT NULL,
    "adhlef_count" INTEGER,
    "capacity" DECIMAL(10,2),
    "total_weight_kg" DECIMAL(10,2) NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_time" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "olive_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_weights" (
    "id" TEXT NOT NULL,
    "olive_entry_id" TEXT NOT NULL,
    "weigh_round" INTEGER NOT NULL DEFAULT 1,
    "bag_number" INTEGER NOT NULL,
    "weight_kg" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pressing_records" (
    "id" TEXT NOT NULL,
    "olive_entry_id" TEXT NOT NULL,
    "oil_quantity_l" DECIMAL(10,2) NOT NULL,
    "region" TEXT,
    "zayat" TEXT,
    "yield_percent" DECIMAL(5,2),
    "amount" DECIMAL(12,2) NOT NULL,
    "aid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oil_collected" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "treatment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treatment_time" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pressing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "pressing_record_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_time" TEXT NOT NULL,
    "method" TEXT,
    "notes" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" TEXT NOT NULL,
    "season_id" TEXT,
    "report_type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_number_key" ON "clients"("client_number");

-- CreateIndex
CREATE INDEX "clients_last_name_first_name_idx" ON "clients"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "clients_deleted_at_idx" ON "clients"("deleted_at");

-- CreateIndex
CREATE INDEX "olive_entries_client_id_idx" ON "olive_entries"("client_id");

-- CreateIndex
CREATE INDEX "olive_entries_season_id_idx" ON "olive_entries"("season_id");

-- CreateIndex
CREATE INDEX "olive_entries_status_idx" ON "olive_entries"("status");

-- CreateIndex
CREATE INDEX "olive_entries_entry_date_idx" ON "olive_entries"("entry_date");

-- CreateIndex
CREATE INDEX "olive_entries_olive_type_idx" ON "olive_entries"("olive_type");

-- CreateIndex
CREATE INDEX "olive_entries_deleted_at_idx" ON "olive_entries"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "olive_entries_season_id_olive_type_reference_number_key" ON "olive_entries"("season_id", "olive_type", "reference_number");

-- CreateIndex
CREATE INDEX "entry_weights_olive_entry_id_idx" ON "entry_weights"("olive_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "pressing_records_olive_entry_id_key" ON "pressing_records"("olive_entry_id");

-- CreateIndex
CREATE INDEX "pressing_records_treatment_date_idx" ON "pressing_records"("treatment_date");

-- CreateIndex
CREATE INDEX "pressing_records_paid_idx" ON "pressing_records"("paid");

-- CreateIndex
CREATE INDEX "pressing_records_oil_collected_idx" ON "pressing_records"("oil_collected");

-- CreateIndex
CREATE INDEX "payments_pressing_record_id_idx" ON "payments"("pressing_record_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "report_snapshots_report_type_period_start_idx" ON "report_snapshots"("report_type", "period_start");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "olive_entries" ADD CONSTRAINT "olive_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "olive_entries" ADD CONSTRAINT "olive_entries_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "olive_entries" ADD CONSTRAINT "olive_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_weights" ADD CONSTRAINT "entry_weights_olive_entry_id_fkey" FOREIGN KEY ("olive_entry_id") REFERENCES "olive_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pressing_records" ADD CONSTRAINT "pressing_records_olive_entry_id_fkey" FOREIGN KEY ("olive_entry_id") REFERENCES "olive_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pressing_records" ADD CONSTRAINT "pressing_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_pressing_record_id_fkey" FOREIGN KEY ("pressing_record_id") REFERENCES "pressing_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
