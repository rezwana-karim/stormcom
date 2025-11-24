-- DropIndex
DROP INDEX `Cart_userId_key`;

-- DropIndex
DROP INDEX `Cart_sessionId_key`;

-- CreateIndex
CREATE UNIQUE INDEX `Cart_userId_storeId_key` ON `Cart`(`userId`, `storeId`);

-- CreateIndex
CREATE UNIQUE INDEX `Cart_sessionId_storeId_key` ON `Cart`(`sessionId`, `storeId`);
