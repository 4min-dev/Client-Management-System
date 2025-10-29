// Types for the Gas Station Management System

export type Currency = 'AMD' | 'RUB' | 'USD' | 'EUR' | 'GEL';

export type StationStatus = 'active' | 'mixed' | 'inactive';

export interface Fuel {
  assignedAt: Date,
  fuel: FuelType,
  fuelId: string,
  id: string,
  stationId: string
}

export interface FuelOnList {
  id: string,
  name: string,
  fuelOnStation: Fuel[]
}

export interface Station {
  id: string;
  firmName: string;
  ownerName: string;
  responsibleName?: string;
  responsibleDescription?: string;
  responsibleContacts?: string[];
  firmContacts: string[];
  country: string;
  city: string;
  address: string;
  processorCount: number;
  pistolCount: number;
  currency: Currency;
  discount: number;
  price: number;
  monthlySum: number;
  prepayment: number;
  licenseDate: Date;
  syncDate: Date;
  macAddress?: string;
  desktopKey?: string;
  processorKey?: string;
  protectionKey?: string;
  responsibleContact?: string

  // Details (Form 8)
  shiftChangeEvents: 0 | 1;
  calibrationChangeEvents: 0 | 1;
  seasonChangeEvents: 0 | 1;
  fuelTypeCount: number;
  fixShiftCount: 0 | 1;
  receiptCoefficient: 0 | 1;
  seasonCount: 1 | 2 | 3 | 4;

  selectedFuelTypes: Fuel[];
  stationsOnFuels: Fuel[]
}

export interface Firm {
  id: string,
  firmName: string;
  ownerName: string;
  stations: Station[];
  totalSum: number;
  totalProcessors: number;
  totalPistols: number;
  avgDiscount: number;
  status: StationStatus;
  oldestSyncDate: Date;
  prepayment: number;
  ownerPhone: string;
  isDeleted: boolean
}

export interface FuelType {
  id: string;
  name: string;
}

export interface CurrencyRate {
  currency: Currency;
  rate: number;
  pricePerPistol: number;
}

export interface Event {
  id: string;
  stationId: string;
  firmName: string;
  ownerName: string;
  country: string;
  city: string;
  address: string;
  responsible: string;
  eventType: string;
  eventName: string;
  date: Date;
  read: boolean;
}

export interface ServerRequest {
  id: string;
  askNum: 0 | 1 | 2;
  dataTime: string;
  ip: string;
  macAddress: string;
  state: number;
}

export interface ServerResponse0 {
  shiftChangeEvents: 0 | 1;
  calibrationChangeEvents: 0 | 1;
  seasonChangeEvents: 0 | 1;
  fixshiftChangeCount: 0 | 1;
  receiptCoefficient: 0 | 1;
  seasonCount: number;
  processorCount: number;
  gunCount: number;
  stationTotalSum: number;
  currency: string;
}

export interface ServerResponse1 {
  id: number;
  name: string;
}

export interface ServerResponse2 {
  licenseEndDate: string;
  serverDate: string;
}

export interface RootState {
  userSlice: {
    user: {
      twoFASecret: string,
    }
  }
}

export interface User {
  id: '',
  login: ''
}