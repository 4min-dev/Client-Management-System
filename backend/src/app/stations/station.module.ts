import { Module } from '@nestjs/common';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StationService } from 'src/app/stations/station.service';
import { StationController } from 'src/app/stations/station.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyModule } from '../companies/company.module';
import { NetworkModule } from '../network/network.module';

@Module({
  imports: [ConfigModule, CompanyModule, CacheModule.register(), NetworkModule],
  controllers: [StationController],
  providers: [CryptoService, ConfigService, StationService]
})
export class StationModule { }
