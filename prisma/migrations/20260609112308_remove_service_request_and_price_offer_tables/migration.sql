/*
  Warnings:

  - You are about to drop the `PriceOffer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PriceOffer" DROP CONSTRAINT "PriceOffer_providerId_fkey";

-- DropTable
DROP TABLE "PriceOffer";
