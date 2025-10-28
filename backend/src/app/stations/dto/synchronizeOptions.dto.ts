import { CurrencyType } from '@prisma/client';

export class SynchronizeOptionsDto {
  pistolCount: number;
  procCount: number;

  shiftChangeEvents: number;
  calibrationChangeEvents: number;
  seasonChangeEvents: number;
  receiptCoefficient: number;
  fixShiftCount: number;

  seasonCount: number;

  currencyType: CurrencyType;
  currencyValue: number;

  constructor(
    pistolCount: number,
    procCount: number,
    shiftChangeEvents: number,
    calibrationChangeEvents: number,
    seasonChangeEvents: number,
    receiptCoefficient: number,
    fixShiftCount: number,
    seasonCount: number,
    currencyType: CurrencyType,
    currencyValue: number,
  ) {
    this.pistolCount = pistolCount;
    this.procCount = procCount;
    this.shiftChangeEvents = shiftChangeEvents;
    this.calibrationChangeEvents = calibrationChangeEvents;
    this.seasonChangeEvents = seasonChangeEvents;
    this.receiptCoefficient = receiptCoefficient;
    this.fixShiftCount = fixShiftCount;
    this.seasonCount = seasonCount;
    this.currencyType = currencyType;
    this.currencyValue = currencyValue;
  }
}
