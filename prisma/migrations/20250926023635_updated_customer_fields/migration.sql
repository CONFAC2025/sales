/*
  Warnings:

  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PotentialLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- DropIndex
DROP INDEX "public"."Customer_email_key";

-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "email",
ADD COLUMN     "interestedProperty" TEXT,
ADD COLUMN     "potential" "public"."PotentialLevel",
ADD COLUMN     "source" TEXT;
