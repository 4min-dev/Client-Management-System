import { CurrencyType } from '@prisma/client';

export class SynchronizeOptionsDto {
  pistolCount: number;
  procCount: number;

  shiftNotificationEnabled: boolean;
  calibrationNotificationEnabled: boolean;
  seasonNotificationEnabled: boolean;
  receiptCoefficientEnabled: boolean;
  fixshiftNotificationEnabled: boolean;

  seasonCount: number;

  currencyType: CurrencyType;
  currencyValue: number;

  constructor(
    pistolCount: number,
    procCount: number,
    shiftNotificationEnabled: boolean,
    calibrationNotificationEnabled: boolean,
    seasonNotificationEnabled: boolean,
    receiptCoefficientEnabled: boolean,
    fixshiftNotificationEnabled: boolean,
    seasonCount: number,
    currencyType: CurrencyType,
    currencyValue: number,
  ) {
    this.pistolCount = pistolCount;
    this.procCount = procCount;
    this.shiftNotificationEnabled = shiftNotificationEnabled;
    this.calibrationNotificationEnabled = calibrationNotificationEnabled;
    this.seasonNotificationEnabled = seasonNotificationEnabled;
    this.receiptCoefficientEnabled = receiptCoefficientEnabled;
    this.fixshiftNotificationEnabled = fixshiftNotificationEnabled;
    this.seasonCount = seasonCount;
    this.currencyType = currencyType;
    this.currencyValue = currencyValue;
  }
}
