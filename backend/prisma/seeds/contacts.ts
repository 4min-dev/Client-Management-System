import contacts from './data/contacts';
import prisma from '../prisma';

export async function seedContacts() {
  await Promise.all(
    contacts.map(async (contact, _) => {
      await prisma.contact.upsert({
        where: {
          id: contact.id,
        },
        update: {},
        create: {
          id: contact.id,
          isOwner: contact.isOwner,
          name: contact.name,
          description: contact.description,
          value: contact.value,
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed contacts - Done!');
}
