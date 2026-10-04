ALTER TABLE "Order"
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "invoiceUrl" TEXT,
ADD COLUMN "invoicePublicId" TEXT,
ADD COLUMN "invoiceCreatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_invoiceNumber_key" ON "Order"("invoiceNumber");
