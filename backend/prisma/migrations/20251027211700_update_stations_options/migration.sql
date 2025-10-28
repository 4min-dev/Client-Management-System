/*
  Warnings:

  - You are about to drop the column `calibrationNotificationEnabled` on the `stations_options` table. All the data in the column will be lost.
  - You are about to drop the column `fixshiftNotificationEnabled` on the `stations_options` table. All the data in the column will be lost.
  - You are about to drop the column `receiptCoefficientEnabled` on the `stations_options` table. All the data in the column will be lost.
  - You are about to drop the column `seasonNotificationEnabled` on the `stations_options` table. All the data in the column will be lost.
  - You are about to drop the column `shiftNotificationEnabled` on the `stations_options` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stations_options" DROP COLUMN "calibrationNotificationEnabled",
DROP COLUMN "fixshiftNotificationEnabled",
DROP COLUMN "receiptCoefficientEnabled",
DROP COLUMN "seasonNotificationEnabled",
DROP COLUMN "shiftNotificationEnabled",
ADD COLUMN     "calibrationChangeEvents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fixShiftCount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiptCoefficient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seasonChangeEvents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shiftChangeEvents" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "seasonCount" SET DEFAULT 1;
