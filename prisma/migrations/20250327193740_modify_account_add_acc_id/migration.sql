/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "accounts_providerAccountId_key";

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
