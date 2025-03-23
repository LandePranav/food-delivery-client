/*
  Warnings:

  - You are about to drop the column `verified` on the `sellers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sellers" DROP COLUMN "verified",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;
