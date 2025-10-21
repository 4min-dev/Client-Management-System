import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async find(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async setTwoFactorAuthenticationSecret(twoFASecret: string, userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        twoFASecret: twoFASecret,
      },
    });
  }

  async setTwoFactorAuthenticationEnabled(status: boolean, userId: string) {
    this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        twoFAEnabled: status,
      },
    });
  }
}
