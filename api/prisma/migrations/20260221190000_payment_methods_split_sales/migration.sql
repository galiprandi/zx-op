-- Create payment methods table
CREATE TABLE "PaymentMethod" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- Case-insensitive uniqueness by name
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");
CREATE UNIQUE INDEX "PaymentMethod_name_lower_key" ON "PaymentMethod"(LOWER("name"));

-- Create check-in sale header table
CREATE TABLE "CheckinSale" (
  "id" TEXT NOT NULL,
  "playerSessionId" TEXT NOT NULL,
  "barcodeIdSnapshot" TEXT NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckinSale_pkey" PRIMARY KEY ("id")
);

-- Create payment allocations table
CREATE TABLE "CheckinSalePaymentAllocation" (
  "id" TEXT NOT NULL,
  "checkinSaleId" TEXT NOT NULL,
  "paymentMethodId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckinSalePaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- Add checkinSale relation to transaction items
ALTER TABLE "Transaction"
ADD COLUMN "checkinSaleId" TEXT;

-- Foreign keys
ALTER TABLE "CheckinSale"
ADD CONSTRAINT "CheckinSale_playerSessionId_fkey"
FOREIGN KEY ("playerSessionId") REFERENCES "PlayerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckinSalePaymentAllocation"
ADD CONSTRAINT "CheckinSalePaymentAllocation_checkinSaleId_fkey"
FOREIGN KEY ("checkinSaleId") REFERENCES "CheckinSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckinSalePaymentAllocation"
ADD CONSTRAINT "CheckinSalePaymentAllocation_paymentMethodId_fkey"
FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_checkinSaleId_fkey"
FOREIGN KEY ("checkinSaleId") REFERENCES "CheckinSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Helpful indexes
CREATE INDEX "CheckinSale_createdAt_idx" ON "CheckinSale"("createdAt");
CREATE INDEX "CheckinSalePaymentAllocation_paymentMethodId_idx" ON "CheckinSalePaymentAllocation"("paymentMethodId");
CREATE INDEX "Transaction_checkinSaleId_idx" ON "Transaction"("checkinSaleId");

-- Initial payment methods
INSERT INTO "PaymentMethod" ("id", "name", "isActive", "isDeleted", "createdAt", "updatedAt")
VALUES
  ('pm_efectivo', 'Efectivo', true, false, NOW(), NOW()),
  ('pm_transferencia', 'Transferencia', true, false, NOW(), NOW()),
  ('pm_qr', 'QR', true, false, NOW(), NOW()),
  ('pm_debito', 'Débito', true, false, NOW(), NOW()),
  ('pm_credito', 'Crédito', true, false, NOW(), NOW());
