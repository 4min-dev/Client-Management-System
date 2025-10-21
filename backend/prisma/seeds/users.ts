import users from './data/users';
import { hash } from 'bcrypt'

import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

export async function seedUsers() {
  await Promise.all(
    users.map(async (user, _) => {
      await prisma.user.upsert({
        where: {
          id: user.id,
        },
        update: {},
        create: {
          id: user.id,
          login: user.login,
          password: await hash(user.password, 10),
        },
      });
    })
  );


  console.debug("[DEBUG] Seed users - Done!");
}