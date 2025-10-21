import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { StationService } from 'src/app/stations/station.service';
import { CompanyService } from '../companies/company.service';

@Module({
  imports: [],
  controllers: [CryptoController],
  providers: [CryptoService, ConfigService, CompanyService, StationService],
  exports: [CryptoService],
})
export class CryptoModule {}
