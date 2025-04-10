/*
  Warnings:

  - The `deliveryStatus` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PROCESSING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryStatus",
ADD COLUMN     "deliveryStatus" "DeliveryStatus" DEFAULT 'PROCESSING';
