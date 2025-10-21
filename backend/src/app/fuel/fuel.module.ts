import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';

@Module({
  imports: [],
  controllers: [FuelController],
  providers: [FuelService, ConfigService],
})
export class FuelModule {
}
