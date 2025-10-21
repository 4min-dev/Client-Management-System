import { Module } from '@nestjs/common';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { StationService } from 'src/app/stations/station.service';
import { StationController } from 'src/app/stations/station.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';

@Module({
  imports: [],
  controllers: [CompanyController],
  providers: [CompanyService, CryptoService, ConfigService, StationService],
  exports: [CompanyService],
})
export class CompanyModule {
}
