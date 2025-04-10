-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sellers" ADD COLUMN     "deliveryCharge" INTEGER NOT NULL DEFAULT 0;
