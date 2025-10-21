import { Module } from '@nestjs/common';
import { UserService } from 'src/app/users/user.service';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [UserService, PrismaService],
})
export class UserModule {}
