/*
  Warnings:

  - A unique constraint covering the columns `[stationId,fuelId]` on the table `stations_on_fuels` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "stations_on_fuels_stationId_fuelId_key" ON "stations_on_fuels"("stationId", "fuelId");
