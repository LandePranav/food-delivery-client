/*
  Warnings:

  - Made the column `price` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `sellers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET NOT NULL;

-- AlterTable
ALTER TABLE "sellers" ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "phone" SET DATA TYPE TEXT,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "phone" SET DATA TYPE TEXT;
