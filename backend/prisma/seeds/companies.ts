import prisma from '../prisma';
import companies from './data/companies';

export async function seedCompanies() {
  await Promise.all(
    companies.map(async (company, _) => {
      await prisma.company.upsert({
        where: {
          id: company.id,
        },
        update: {},
        create: {
          id: company.id,
          name: company.name,
          description: company.description,
          ownerContactId: company.ownerContactId,
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed companies - Done!');
}
