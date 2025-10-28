import {
  Body,
  Controller,
  Request,
  Patch,
  Post,
  Get,
  Param,
  ParseIntPipe,
  NotAcceptableException, Inject, Delete, Put,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StationService } from './station.service';
import { SynchronizeLicenseDto } from './dto/synchronizeLicense.dto';

import * as dayjs from 'dayjs';
import { CryptoService } from '../crypto/crypto.service';
import { SynchronizeOptionsDto } from 'src/app/stations/dto/synchronizeOptions.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getFuelsChangedEventKey, getOptionsChangedEventKey } from './utils/cacheKeys';
import { CreateStationMessageDto } from './dto/createStationMessage.dto';
import { CreateStationDto } from './dto/createStationDto.dto';

@Controller('station')
export class StationController {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private stationService: StationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
  }

  @Get('/list')
  async getStations() {
    return this.stationService.getAll();
  }

  @Put('/create')
  async createStations(@Body() dto: CreateStationDto) {
    return this.stationService.createStation(dto);
  }

  @Post('update/:stationId')
  async updateStationOptions(@Param('stationId') stationId: string) {
    await this.cacheManager.set<boolean>(getOptionsChangedEventKey(stationId), true);
    await this.cacheManager.set<boolean>(getFuelsChangedEventKey(stationId), true);
  }

  @Delete('delete/:stationId')
  async deleteStation(@Param('stationId') stationId: string) {
    return this.stationService.deleteFuel(stationId);
  }

  @Get('messages/:stationId/list')
  async getStationMessages(@Param('stationId') stationId: string) {
    return this.stationService.getMessages(stationId);
  }

  @Put('messages/:stationId/create')
  async createStationMessage(@Param('stationId') stationId: string, @Body() dto: CreateStationMessageDto) {
    return this.stationService.createMessage(stationId, dto);
  }

  @Patch('message/:messageId/view')
  async updateStationMessages(@Param('messageId') messageId: string) {
    return this.stationService.updateMessage(messageId, { view: true });
  }

  @Get('synchronize/crypt/:stationId/options')
  async synchronizeOptions(
    @Param('stationId') stationId: string,
  ) {
    const station = await this.stationService.findOne(stationId);
    const stationKey = station.cryptoKey?.key;

    if (!stationKey) {
      throw new NotAcceptableException('Station doenst have cryptokey');
    }

    const responseDto = new SynchronizeOptionsDto(
      station.pistolCount,
      station.procCount,
      station.stationsOptions.shiftChangeEvents,
      station.stationsOptions.calibrationChangeEvents,
      station.stationsOptions.seasonChangeEvents,
      station.stationsOptions.receiptCoefficient,
      station.stationsOptions.fixShiftCount,
      station.stationsOptions.seasonCount,
      station.currencyType,
      station.currencyValue,
    );

    await this.cacheManager.del(getOptionsChangedEventKey(stationId));

    return this.cryptoService.cryptData(
      JSON.stringify(responseDto),
      stationKey,
    );
  }

  @Get('synchronize/crypt/:stationId/fuels')
  async synchronizeFuels(
    @Param('stationId') stationId: string,
  ) {
    const station = await this.stationService.findOne(stationId);
    const stationKey = station.cryptoKey?.key;

    if (!stationKey) {
      throw new NotAcceptableException('Station doenst have cryptokey');
    }

    const fuelsOnStation =
      await this.stationService.findStationFuelsOne(stationId);

    const fuels = fuelsOnStation.stationsOnFuels.map((t) => t.fuel);

    await this.cacheManager.del(getFuelsChangedEventKey(stationId));

    return this.cryptoService.cryptData(JSON.stringify(fuels), stationKey);
  }

  @Get('synchronize/crypt/:stationId/license')
  async synchronizeLicense(
    @Param('stationId') stationId: string,
  ) {
    const station = await this.stationService.findOne(stationId);
    const stationKey = station.cryptoKey?.key;

    if (!stationKey) {
      throw new NotAcceptableException('Station doenst have cryptokey');
    }

    return this.cryptoService.cryptData(
      JSON.stringify(
        new SynchronizeLicenseDto(
          dayjs().add(2, 'h').toDate(),
          dayjs().toDate(),
        ),
      ),
      stationKey,
    );
  }
}
