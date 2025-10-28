import prisma from '../prisma';
import companies from './data/companies';

export async function seedCompanies() {
  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: {
        responsibleContactId: company.responsibleContactId || undefined,
      },
      create: {
        id: company.id,
        name: company.name,
        description: company.description,
        ownerContactId: company.ownerContactId,
        responsibleContactId: company.responsibleContactId || undefined,
      },
    });
  }

  console.debug('[DEBUG] Seed companies - Done!');
}
