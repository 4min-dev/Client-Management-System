import { BadRequestException, Body, Controller, Get, Patch, Post, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';
import { CryptDto } from './dto/crypt.dto';
import { UpdateStationCryptoKeyDto } from '../stations/dto/updateStationCryptoKey.dto';
import { StationService } from '../stations/station.service';
import { ApiResponse } from '@nestjs/swagger';
import { CryptKeyResponse } from './dto/newCryptKey.response';
import { CreateStationCryptoKeyDto } from '../stations/dto/createStationCryptoKey.dto';
import { UseGuards } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/auth/jwt.guard';

@Controller('crypto')
export class CryptoController {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private stationService: StationService,
  ) { }

  @Get('key')
  getBackendKey(@Request() req) {
    return this.configService.get('CRYPTO_KEY');
  }

  @Post('/crypt')
  crypt(@Request() req, @Body() dto: CryptDto) {
    const backendCryptKey = this.configService.get('CRYPTO_KEY');

    return this.cryptoService.cryptData(dto.data, backendCryptKey);
  }

  @Post('/decrypt')
  decrypt(@Request() req, @Body() dto: CryptDto) {
    var backendCryptKey = this.configService.get('CRYPTO_KEY');

    return this.cryptoService.decryptData(dto.data, backendCryptKey);
  }

  @Post('key')
  @ApiResponse({ status: 404, description: 'Station not found' })
  @ApiResponse({
    status: 406,
    description: 'MAC address is invalid',
  })
  async createKey(@Request() req, @Body() dto: CryptDto) {
    var backendCryptKey = this.configService.get('CRYPTO_KEY');
    var encryptedData = await this.cryptoService.decryptData(
      dto.data,
      backendCryptKey,
    );

    var decryptedData: CreateStationCryptoKeyDto = JSON.parse(encryptedData);

    console.log('dto', dto.data)
    console.log('create')
    console.log(decryptedData)

    var newStationKey = await this.stationService.upsertStationKey(
      decryptedData.stationId,
      decryptedData.macAddress,
      decryptedData.key
    );

    return this.cryptoService.cryptData(
      JSON.stringify(
        new CryptKeyResponse(newStationKey.key, newStationKey.expiredAt),
      ),
      backendCryptKey,
    );
  }

  @Patch('key')
  @ApiResponse({ status: 404, description: 'Station not found' })
  @ApiResponse({
    status: 406,
    description: 'MAC address is invalid',
  })
  async updateKey(@Request() req, @Body() dto: CryptDto) {
    const backendCryptKey = this.configService.get('CRYPTO_KEY');
    var encryptedData = await this.cryptoService.decryptData(
      dto.data,
      backendCryptKey,
    );

    var decryptedData: UpdateStationCryptoKeyDto = JSON.parse(encryptedData);
    console.log('update')
    console.log(decryptedData)
    var newStationKey = await this.stationService.upsertStationKey(
      decryptedData.stationId,
      decryptedData.macAddress,
      decryptedData.key,
    );

    return this.cryptoService.cryptData(
      JSON.stringify(
        new CryptKeyResponse(newStationKey.key, newStationKey.expiredAt),
      ),
      backendCryptKey,
    );
  }

  @Get('key/:stationId')
  @UseGuards(JwtAuthGuard)
  async getStationKey(@Param('stationId') stationId: string) {
    const station = await this.stationService.findOne(stationId);

    if (!station.cryptoKey) {
      throw new NotFoundException('Ключ не найден');
    }

    return {
      key: station.cryptoKey.key,
      expiredAt: station.cryptoKey.expiredAt,
    };
  }
}