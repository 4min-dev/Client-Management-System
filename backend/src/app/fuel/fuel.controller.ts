import {
  Body,
  Controller, Delete,
  Get, Inject, Param, Post, Put,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { FuelService } from './fuel.service';
import { CreateFuelDto } from './dto/createFuel.dto';
import { UpdateFuelDto } from './dto/updateFuel.dto';

@Controller('fuel')
export class FuelController {
  constructor(
    private fuelService: FuelService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
  }

  @Get('/list')
  async getCurrencies() {
    return this.fuelService.getFuels();
  }

  @Post('/update')
  async updateCurrencies(@Body() dto: UpdateFuelDto) {
    return this.fuelService.updateFuel(dto);
  }

  @Put('/create')
  async createCurrencies(@Body() dto: CreateFuelDto) {
    return this.fuelService.createFuel(dto);
  }

  @Delete('/delete/:id')
  async deleteCurrencies(@Param('id') id: string) {
    return this.fuelService.deleteFuel(id);
  }
}
