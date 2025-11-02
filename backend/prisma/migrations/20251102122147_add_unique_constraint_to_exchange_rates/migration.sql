/*
  Warnings:

  - A unique constraint covering the columns `[fromCurrencyType,toCurrencyType]` on the table `exchange_rates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_fromCurrencyType_toCurrencyType_key" ON "exchange_rates"("fromCurrencyType", "toCurrencyType");
