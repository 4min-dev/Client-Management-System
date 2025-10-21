import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StationCryptoKey, StationStatus } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import * as dayjs from 'dayjs';
import prisma from 'prisma/prisma';
import fuel from 'prisma/seeds/data/fuel';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { promisify } from 'util';
import { CreateStationMessageDto } from './dto/createStationMessage.dto';
import { CreateStationDto } from './dto/createStationDto.dto';
import { CompanyService } from '../companies/company.service';
import { CreateCompanyDto } from '../companies/dto/createCompany.dto';

@Injectable()
export class StationService {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private companyService: CompanyService,
  ) {
  }

  getAll() {
    return prisma.station.findMany({
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

    let contact = await prisma.contact.create({
      data: {
        isOwner: false,
        name: dto.contactName,
        description: dto.contactDescription,
      },
    });

    let stationOptions = await prisma.stationsOptions.create({
      data: {},
    });

    return prisma.station.create({
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
    return prisma.stationMessages.findMany({ where: { stationId } });
  }

  updateMessage(messageId: string, { view }: { view?: boolean }) {
    return prisma.stationMessages.update({ where: { id: messageId }, data: { viewed: view } });
  }

  createMessage(stationId: string, dto: CreateStationMessageDto) {
    return prisma.stationMessages.create({
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
    const station = await prisma.station.findFirst({
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

    const updatedStation = await prisma.station.update({
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
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: { cryptoKey: true, stationsOptions: true },
    });

    if (!station) {
      throw new NotFoundException(`Station with id ${stationId} not found`);
    }

    return station;
  }

  async isKeyExpired(stationId: string): Promise<boolean> {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: { cryptoKey: true, stationsOptions: true },
    });

    if (!station) {
      throw new NotFoundException(`Station with id ${stationId} not found`);
    }

    return dayjs().isAfter(dayjs(station.cryptoKey.expiredAt));
  }

  async findStationFuelsOne(stationId: string) {
    const fuels = await prisma.station.findUnique({
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

  deleteFuel(stationId: string) {
    return prisma.station.delete({ where: { id: stationId } });
  }
}
