import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { CurrencyType } from '@prisma/client';
import prisma from '../../../prisma/prisma';
import { CreateFuelDto } from './dto/createFuel.dto';
import { UpdateFuelDto } from './dto/updateFuel.dto';

@Injectable()
export class FuelService {
  constructor() {

  }

  getFuels() {
    return prisma.fuel.findMany({
      include: {
        fuelOnStation: true,
      },
    });
  }

  createFuel(dto: CreateFuelDto) {
    return prisma.fuel.create({
      data: dto,
    });
  }

  updateFuel(dto: UpdateFuelDto) {
    return prisma.fuel.update({
      where: {
        id: dto.id,
      },
      data: {
        name: dto.name,
      },
    });
  }

  async deleteFuel(id: string) {
    const fuel = await prisma.fuel.findUnique({ where: { id }, include: { fuelOnStation: true } });

    if (fuel.fuelOnStation.length > 0) {
      throw new BadRequestException('Fuels has stations');
    }

    return prisma.fuel.delete({ where: { id } });
  }
}
