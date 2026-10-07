CREATE INDEX "Product_isActive_updatedAt_idx"
ON "Product" ("isActive", "updatedAt");

CREATE INDEX "Product_categoryId_isActive_updatedAt_idx"
ON "Product" ("categoryId", "isActive", "updatedAt");

CREATE INDEX "Product_subcategoryId_isActive_updatedAt_idx"
ON "Product" ("subcategoryId", "isActive", "updatedAt");

CREATE INDEX "Product_itemTypeId_isActive_updatedAt_idx"
ON "Product" ("itemTypeId", "isActive", "updatedAt");

CREATE INDEX "Product_kind_isActive_updatedAt_idx"
ON "Product" ("kind", "isActive", "updatedAt");

CREATE INDEX "Order_userId_createdAt_idx"
ON "Order" ("userId", "createdAt");

CREATE INDEX "Order_status_createdAt_idx"
ON "Order" ("status", "createdAt");

CREATE INDEX "Payment_userId_createdAt_idx"
ON "Payment" ("userId", "createdAt");

CREATE INDEX "Review_productId_createdAt_idx"
ON "Review" ("productId", "createdAt");
