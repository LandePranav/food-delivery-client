/*
  Warnings:

  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[restaurantName]` on the table `sellers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "gpsLocation" JSONB;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "category",
ADD COLUMN     "categories" TEXT[];

-- AlterTable
ALTER TABLE "sellers" ADD COLUMN     "gpsLocation" JSONB,
ADD COLUMN     "restaurantName" TEXT,
ADD COLUMN     "speciality" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
ADD COLUMN     "addresses" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "sellers_restaurantName_key" ON "sellers"("restaurantName");
