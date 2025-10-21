import { Module } from '@nestjs/common';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { StationService } from 'src/app/stations/station.service';
import { StationController } from 'src/app/stations/station.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyService } from '../companies/company.service';
import { CompanyModule } from '../companies/company.module';

@Module({
  imports: [],
  controllers: [StationController],
  providers: [CryptoService, CompanyService, ConfigService, StationService],
})
export class StationModule {}
