-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "responsibleContactId" TEXT;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_responsibleContactId_fkey" FOREIGN KEY ("responsibleContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
