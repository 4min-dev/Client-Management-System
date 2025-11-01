import { Module } from '@nestjs/common';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StationService } from 'src/app/stations/station.service';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { JwtModule } from '@nestjs/jwt';
import { NetworkModule } from '../network/network.module';

@Module({
  imports: [
    NetworkModule,
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '60m' },
    }),
    CacheModule.register(),
  ],
  controllers: [CompanyController],
  providers: [CompanyService, CryptoService, ConfigService, StationService],
  exports: [CompanyService],
})
export class CompanyModule {
}
