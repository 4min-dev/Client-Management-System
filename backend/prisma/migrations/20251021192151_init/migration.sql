-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('AMD', 'RUB', 'USD', 'EUR', 'GEL');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('Active', 'NotActive');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "twoFASecret" TEXT,
    "twoFAEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerContactId" TEXT NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "procCount" INTEGER NOT NULL,
    "pistolCount" INTEGER NOT NULL,
    "currencyType" "CurrencyType" NOT NULL,
    "currencyValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "synchronize" TIMESTAMP(3),
    "status" "StationStatus" NOT NULL,
    "paidUntil" TIMESTAMP(3),
    "discount" DOUBLE PRECISION NOT NULL,
    "contactId" TEXT,
    "macAddress" TEXT,
    "cryptoKeyId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stationsOptionsId" TEXT NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations_messages" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stationId" TEXT NOT NULL,
    "viewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stations_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations_options" (
    "id" TEXT NOT NULL,
    "shiftNotificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "calibrationNotificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "seasonNotificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "receiptCoefficientEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fixshiftNotificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "seasonCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stations_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations_on_fuels" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stations_on_fuels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations_crypto_keys" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "key" TEXT,
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stations_crypto_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "fromCurrencyType" "CurrencyType" NOT NULL,
    "toCurrencyType" "CurrencyType" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pistol_rates" (
    "id" TEXT NOT NULL,
    "currencyType" "CurrencyType" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pistol_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "fuels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "stations_stationsOptionsId_key" ON "stations"("stationsOptionsId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerContactId_fkey" FOREIGN KEY ("ownerContactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_cryptoKeyId_fkey" FOREIGN KEY ("cryptoKeyId") REFERENCES "stations_crypto_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_stationsOptionsId_fkey" FOREIGN KEY ("stationsOptionsId") REFERENCES "stations_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations_messages" ADD CONSTRAINT "stations_messages_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations_on_fuels" ADD CONSTRAINT "stations_on_fuels_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations_on_fuels" ADD CONSTRAINT "stations_on_fuels_fuelId_fkey" FOREIGN KEY ("fuelId") REFERENCES "fuels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
