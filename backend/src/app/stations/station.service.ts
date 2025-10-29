import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StationCryptoKey, StationStatus } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import * as dayjs from 'dayjs';
import { PrismaService } from 'prisma/prisma.service';
import fuel from 'prisma/seeds/data/fuel';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { promisify } from 'util';
import { CreateStationMessageDto } from './dto/createStationMessage.dto';
import { CreateStationDto } from './dto/createStationDto.dto';
import { CompanyService } from '../companies/company.service';
import { CreateCompanyDto } from '../companies/dto/createCompany.dto';
import { UpdateStationSyncDto } from './dto/updateStationSync.dto';
import { getFuelsChangedEventKey, getOptionsChangedEventKey } from './utils/cacheKeys';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DeleteStationDto } from './dto/deleteStation.dto';
import { Request } from 'express';

@Injectable()
export class StationService {
  constructor(
    private readonly prisma: PrismaService,
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private companyService: CompanyService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
  }

  getAll() {
    return this.prisma.station.findMany({
      include: {
        stationsOnFuels: {
          include: {
            fuel: true,
          },
        },
      },
    });
  }

  async createStation(dto: CreateStationDto) {
    let company = await this.companyService.getByName(dto.companyName);

    if (!company) {
      let createCompanyDto = new CreateCompanyDto();

      createCompanyDto.name = dto.companyName;
      createCompanyDto.ownerName = dto.ownerCompanyName;
      createCompanyDto.description = dto.contactDescription;

      company = await this.companyService.createCompany(createCompanyDto);
    }

    let contact = await this.prisma.contact.create({
      data: {
        isOwner: false,
        name: dto.contactName,
        description: dto.contactDescription,
      },
    });

    let stationOptions = await this.prisma.stationsOptions.create({
      data: {},
    });

    return this.prisma.station.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        stationsOptionsId: stationOptions.id,
        country: dto.country,
        city: dto.city,
        address: dto.address,
        procCount: dto.procCount,
        pistolCount: dto.pistolCount,
        currencyType: dto.currencyType,
        discount: dto.discount,
        status: StationStatus.NotActive,
      },
    });
  }

  getMessages(stationId: string) {
    return this.prisma.stationMessages.findMany({ where: { stationId } });
  }

  updateMessage(messageId: string, { view }: { view?: boolean }) {
    return this.prisma.stationMessages.update({ where: { id: messageId }, data: { viewed: view } });
  }

  createMessage(stationId: string, dto: CreateStationMessageDto) {
    return this.prisma.stationMessages.create({
      data: {
        stationId: stationId,
        text: dto.text,
        viewed: false,
      },
    });
  }

  async upsertStationKey(
    stationId: string,
    macAddress: string,
    key: string | undefined = undefined,
  ): Promise<StationCryptoKey> {
    const station = await this.prisma.station.findFirst({
      where: {
        id: stationId,
      },
      include: {
        cryptoKey: true,
      },
    });

    if (!station) {
      throw new NotFoundException();
    }

    if (
      (station.macAddress != null &&
        station.macAddress != macAddress) ||
      (key == undefined && station.cryptoKey != null) ||
      (key != undefined && !(station.cryptoKey.key == key))
    ) {
      throw new NotAcceptableException();
    }

    const newKey = await this.cryptoService.generateKey();

    const keyExpires = this.configService.get<number>('CRYPTO_KEY_EXPIRES_IN');

    const updatedStation = await this.prisma.station.update({
      where: {
        id: stationId,
      },
      include: {
        cryptoKey: true,
      },
      data: {
        macAddress: macAddress,
        cryptoKey: {
          upsert: {
            update: {
              stationId: stationId,
              key: newKey,
              expiredAt: dayjs().add(keyExpires, 's').toDate(),
            },
            create: {
              stationId: stationId,
              key: newKey,
              expiredAt: dayjs().add(keyExpires, 's').toDate(),
            },
          },
        },
      },
    });

    return updatedStation.cryptoKey;
  }

  async findOne(stationId: string) {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: { cryptoKey: true, stationsOptions: true },
    });

    if (!station) {
      throw new NotFoundException(`Station with id ${stationId} not found`);
    }

    return station;
  }

  async isKeyExpired(stationId: string): Promise<boolean> {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: { cryptoKey: true, stationsOptions: true },
    });

    if (!station) {
      throw new NotFoundException(`Station with id ${stationId} not found`);
    }

    return dayjs().isAfter(dayjs(station.cryptoKey.expiredAt));
  }

  async findStationFuelsOne(stationId: string) {
    const fuels = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: {
        stationsOnFuels: {
          include: {
            fuel: true,
          },
        },
        stationsOptions: true,
      },
    });

    if (!fuels) {
      throw new NotFoundException(
        `Fuels for the station with id ${stationId} not found`,
      );
    }

    return fuels;
  }

  async deleteStation(
    stationId: string,
    user: { userId: string; login: string },
    password: string,
  ) {
    console.log('DELETE STATION STARTED');
    console.log('stationId:', stationId);
    console.log('user.userId:', user.userId);

    if (!password) {
      console.log('NO PASSWORD — THROW 401');
      throw new UnauthorizedException('Пароль обязателен');
    }

    console.log('SEARCHING USER IN DB WITH ID:', user.userId);
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });

    console.log('DB USER FOUND:', !!dbUser);
    if (!dbUser) {
      console.log('USER NOT FOUND — THROWING 401');
      throw new UnauthorizedException('Пользователь не найден');
    }

    console.log('PASSWORD CHECK...');
    const isPasswordValid = await this.cryptoService.verifyPassword(
      password,
      dbUser.id
    );

    if (!isPasswordValid) {
      console.log('INVALID PASSWORD — THROW 401');
      throw new UnauthorizedException('Неверный пароль');
    }

    console.log('SEARCHING STATION...');
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: {
        stationsOnFuels: true,
        cryptoKey: true,
        stationsOptions: true,
        stationMessages: true,
        stationEvents: true,
      },
    });

    if (!station) {
      console.log('STATION NOT FOUND — THROW 404');
      throw new NotFoundException('Станция не найдена');
    }

    await this.prisma.$transaction([
      this.prisma.stationsOnFuels.deleteMany({ where: { stationId } }),
      this.prisma.stationMessages.deleteMany({ where: { stationId } }),
      this.prisma.stationEvent.deleteMany({ where: { stationId } }),

      station.cryptoKeyId
        ? this.prisma.stationCryptoKey.delete({ where: { id: station.cryptoKeyId } })
        : this.prisma.$queryRaw`SELECT 1`,

      // Удаляем станцию
      this.prisma.station.delete({ where: { id: stationId } }),

      // Удаляем опции
      station.stationsOptionsId
        ? this.prisma.stationsOptions.delete({ where: { id: station.stationsOptionsId } })
        : this.prisma.$queryRaw`SELECT 1`,
    ]);

    return { success: true };
  }

  deleteFuel(stationId: string) {
    return this.prisma.station.delete({ where: { id: stationId } });
  }

  async updateStationSync(
    stationId: string,
    dto: UpdateStationSyncDto,
  ) {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: { stationsOptions: true },
    });

    if (!station) throw new NotFoundException('Station not found');

    const updates: Promise<any>[] = [];

    if (dto.fuels !== undefined) {
      updates.push(
        this.prisma.stationsOnFuels.deleteMany({ where: { stationId } }).then(() => {
          if (dto.fuels.length > 0) {
            return this.prisma.stationsOnFuels.createMany({
              data: dto.fuels.map(f => ({
                stationId,
                fuelId: f.fuelId,
                assignedAt: new Date(),
              })),
            });
          }
        })
      );
      updates.push(this.cacheManager.set(getFuelsChangedEventKey(stationId), true));
    }

    if (dto.options !== undefined) {
      updates.push(
        this.prisma.stationsOptions.update({
          where: { id: station.stationsOptionsId },
          data: dto.options,
        })
      );
      updates.push(this.cacheManager.set(getOptionsChangedEventKey(stationId), true));
    }

    await Promise.all(updates);
    return { success: true };
  }
}
