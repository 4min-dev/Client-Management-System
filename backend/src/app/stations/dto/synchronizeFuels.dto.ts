import { Fuel } from '@prisma/client';

export class SynchronizeFuelsDto {
  fuels: Fuel[];

  constructor(fuels: Fuel[]) {
    this.fuels = fuels;
  }
}
