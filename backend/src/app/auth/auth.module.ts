import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from 'src/app/auth/auth.controller';
import { UserService } from 'src/app/users/user.service';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { Jwt2faStrategy } from 'src/infrastructure/auth/jwt2fa.strategy';
import { JwtStrategy } from 'src/infrastructure/auth/jwt.strategy';
import { AuthHelper } from 'src/infrastructure/auth/auth.helper';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secretOrPrivateKey: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: 3600,
        },
      }),
      inject: [ConfigService],
    }),
    EmailModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    ConfigService,
    UserService,
    // Jwt2faStrategy,
    JwtStrategy,
    AuthHelper
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule { }
