import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import prisma from 'prisma/prisma';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { endOfMonth } from 'date-fns';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CompanyService {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) { }

  async getById(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        ownerContact: true,
        responsibleContact: true,
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

    if (!company) {
      throw new NotFoundException(`Компания с id ${companyId} не найдена`);
    }

    return company;
  }

  async getByName(companyName: string) {
    return prisma.company.findFirst({
      where: {
        name: {
          equals: companyName,
          mode: 'insensitive',
        },
      },
      include: {
        ownerContact: true,
        responsibleContact: true,
      },
    });
  }

  async getAll() {
    return prisma.company.findMany({
      include: {
        ownerContact: true,
        responsibleContact: true,
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

  async createCompany(company: CreateCompanyDto) {
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
        responsibleContact: company.responsibleName
          ? {
            create: {
              name: company.responsibleName,
              isOwner: false,
            },
          }
          : undefined,
      },
      include: {
        ownerContact: true,
        responsibleContact: true,
      },
    });
  }

  async update(dto: UpdateCompanyDto) {
    const existing = await prisma.company.findUnique({
      where: { id: dto.id },
    });

    if (!existing) {
      throw new NotFoundException('Компания не найдена');
    }

    return prisma.company.update({
      where: { id: dto.id },
      data: {
        name: dto.name,
        description: dto.description,
        responsibleContact: dto.responsibleName
          ? {
            upsert: {
              update: {
                name: dto.responsibleName,
              },
              create: {
                name: dto.responsibleName,
                isOwner: false,
              },
            },
          }
          : undefined,
      },
      include: {
        ownerContact: true,
        responsibleContact: true,
      },
    });
  }

  async deleteCompany(companyId: string, password: string, authToken: string) {
    // Верификация JWT-токена
    let userId: string;
    try {
      const payload = this.jwtService.verify(authToken);
      userId = payload.sub;
    } catch (error) {
      throw new UnauthorizedException('Недействительный токен');
    }

    // Проверка пароля
    const isPasswordValid = await this.cryptoService.verifyPassword(password, userId);
    if (!isPasswordValid) {
      throw new NotAcceptableException('Неверный пароль');
    }

    // Находим компанию с её станциями
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        stations: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Компания с id ${companyId} не найдена`);
    }

    // Рассчитываем предоплату и ограничиваем активность станций текущим месяцем
    const currentDate = new Date();
    const currentMonthEnd = endOfMonth(currentDate);
    let totalPrepayment = 0;

    for (const station of company.stations) {
      if (station.paidUntil && station.paidUntil > currentMonthEnd) {
        const monthsPaid = Math.floor(
          (station.paidUntil.getTime() - currentMonthEnd.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        const monthlyPayment = station.currencyValue;
        const prepayment = monthsPaid * monthlyPayment;

        totalPrepayment += prepayment;

        await prisma.station.update({
          where: { id: station.id },
          data: {
            paidUntil: currentMonthEnd,
            prepayment: {
              increment: prepayment,
            },
          },
        });
      }
    }

    // Помечаем компанию как удаленную и сохраняем сумму предоплаты
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        isDeleted: true,
        prepayment: totalPrepayment,
      },
      include: {
        ownerContact: true,
        responsibleContact: true,
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

    return updatedCompany;
  }

  async permanentlyDeleteCompany(companyId: string, password: string, authToken: string) {
    // Верификация JWT-токена
    let userId: string;
    try {
      const payload = this.jwtService.verify(authToken);
      userId = payload.sub;
    } catch (error) {
      throw new UnauthorizedException('Недействительный токен');
    }

    // Проверка пароля
    const isPasswordValid = await this.cryptoService.verifyPassword(password, userId);
    if (!isPasswordValid) {
      throw new NotAcceptableException('Неверный пароль');
    }

    // Находим компанию
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Компания с id ${companyId} не найдена`);
    }

    // Проверяем, что компания уже помечена как удаленная
    if (!company.isDeleted) {
      throw new NotAcceptableException('Компания не помечена как удаленная');
    }

    // Удаляем все связанные станции
    await prisma.station.deleteMany({
      where: { companyId: companyId },
    });

    // Удаляем компанию
    await prisma.company.delete({
      where: { id: companyId },
    });

    return { message: `Компания с id ${companyId} и её станции успешно удалены` };
  }
}