-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "client_number" DROP DEFAULT;
DROP SEQUENCE "clients_client_number_seq";
