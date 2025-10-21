import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StationCryptoKey } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import * as dayjs from 'dayjs';
import prisma from 'prisma/prisma';
import fuel from 'prisma/seeds/data/fuel';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { promisify } from 'util';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { CreateCompanyDto } from './dto/createCompany.dto';

@Injectable()
export class CompanyService {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
  ) {
  }

  getById(companyId: string) {
    return prisma.company.findUnique({
      where: { id: companyId }, include: {
        stations: true,
      },
    });
  }

  getByName(companyName: string) {
    return prisma.company.findFirst({
      where: {
        name: {
          equals: companyName,
          mode: 'insensitive',
        },
      },
    });
  }

  getAll() {
    return prisma.company.findMany({
      include: {
        stations: {
          include: {
            stationsOnFuels: {
              include: {
                fuel: true,
              },
            },
          },
        },
      },
    });
  }

  createCompany(company: CreateCompanyDto) {
    return prisma.company.create({
      data: {
        name: company.name,
        description: company.description,
        ownerContact: {
          create: {
            name: company.ownerName!,
            isOwner: true,
          },
        },
      },
    });
  }

  update(dto: UpdateCompanyDto) {
    return prisma.company.updateMany({
      where: {
        id: dto.id,
      },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }
}
