import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StationService } from 'src/app/stations/station.service';
import { CompanyModule } from '../companies/company.module';

@Module({
  imports: [ConfigModule, CompanyModule],
  controllers: [CryptoController],
  providers: [CryptoService, ConfigService, StationService],
  exports: [CryptoService],
})
export class CryptoModule { }
