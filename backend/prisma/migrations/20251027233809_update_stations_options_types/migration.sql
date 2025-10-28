/*
  Warnings:

  - The `calibrationChangeEvents` column on the `stations_options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fixShiftCount` column on the `stations_options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `receiptCoefficient` column on the `stations_options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `seasonChangeEvents` column on the `stations_options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shiftChangeEvents` column on the `stations_options` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "stations_options" DROP COLUMN "calibrationChangeEvents",
ADD COLUMN     "calibrationChangeEvents" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "fixShiftCount",
ADD COLUMN     "fixShiftCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "receiptCoefficient",
ADD COLUMN     "receiptCoefficient" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "seasonChangeEvents",
ADD COLUMN     "seasonChangeEvents" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "shiftChangeEvents",
ADD COLUMN     "shiftChangeEvents" INTEGER NOT NULL DEFAULT 0;
