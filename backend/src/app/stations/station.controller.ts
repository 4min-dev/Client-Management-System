import {
  Body,
  Controller,
  Patch,
  Post,
  Get,
  Param,
  ParseIntPipe,
  NotAcceptableException, Inject, Delete, Put,
  Req,
  UnauthorizedException,
  UseGuards,
  BadRequestException,
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
import { UpdateStationSyncDto } from './dto/updateStationSync.dto';
import { DeleteStationDto } from './dto/deleteStation.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/infrastructure/auth/jwt.guard';
import { UpdateStationDto } from './dto/updateStationDto.dto';
import { NetworkService } from '../network/network.service';

@Controller('station')
export class StationController {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private networkService: NetworkService,
    private stationService: StationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
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
  @UseGuards(JwtAuthGuard)
  async deleteStation(
    @Param('stationId') stationId: string,
    @Req() request: Request,
    @Body() dto: DeleteStationDto,
  ) {
    const rawUser = request.user as any;
    console.log('RAW USER:', rawUser);

    const user = {
      userId: rawUser.userId || rawUser.id,
      login: rawUser.login,
    };

    if (!user.userId) {
      throw new UnauthorizedException('Invalid user in token');
    }

    return this.stationService.deleteStation(stationId, user, dto.password);
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
  async synchronizeOptions(@Param('stationId') stationId: string) {
    const station = await this.stationService.findOne(stationId);
    const stationKey = station.cryptoKey?.key;

    if (!stationKey) {
      throw new NotAcceptableException('Station doesnt have cryptokey');
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

    return this.cryptoService.cryptData(JSON.stringify(responseDto), stationKey);
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

  @Patch('synchronize/crypt/:stationId/update')
  async updateStationSync(
    @Param('stationId') stationId: string,
    @Body() body: { data: string },
  ) {
    console.log('Received encrypted:', body.data);

    const station = await this.stationService.findOne(stationId);
    const stationKey = station.cryptoKey?.key;

    if (!stationKey) {
      throw new NotAcceptableException('Station doesnt have cryptokey');
    }

    console.log('Using stationKey:', stationKey);

    const decrypted = await this.cryptoService.decryptData(body.data, stationKey);
    console.log('Decrypted:', decrypted);

    let dto: UpdateStationSyncDto;
    try {
      dto = JSON.parse(decrypted);
    } catch (err) {
      console.error('JSON parse error:', err);
      console.error('Decrypted string:', decrypted);
      throw new BadRequestException('Invalid JSON after decryption');
    }

    console.log('dto', dto);
    await this.stationService.updateStationSync(stationId, dto);

    return { success: true };
  }

  @Patch('update/:stationId')
  @UseGuards(JwtAuthGuard)
  async updateStation(
    @Param('stationId') stationId: string,
    @Body() dto: UpdateStationDto,
    @Req() request: Request,
  ) {
    const user = request.user as any;
    if (!user?.userId) {
      throw new UnauthorizedException('Invalid user');
    }

    return this.stationService.updateStation(stationId, dto);
  }
}
