/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrls" TEXT[];
