-- Missing cancel permission (granular)
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'OIL_SALES_SALES_CANCEL';
