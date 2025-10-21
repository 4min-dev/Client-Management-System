// Local state management using localStorage

import type { Station, FuelType, CurrencyRate, Event, Firm } from './types';

const STORAGE_KEYS = {
  STATIONS: 'gas_stations',
  FUEL_TYPES: 'fuel_types',
  CURRENCY_RATES: 'currency_rates',
  EVENTS: 'events',
  USER: 'current_user'
};

export class AppStore {
  // Stations
  static getStations(): Station[] {
    const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
    return data ? JSON.parse(data, this.dateReviver) : this.getDefaultStations();
  }
  
  static saveStation(station: Station): void {
    const stations = this.getStations();
    const index = stations.findIndex(s => s.id === station.id);
    if (index >= 0) {
      stations[index] = station;
    } else {
      stations.push(station);
    }
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
  }
  
  static deleteStation(id: string): void {
    const stations = this.getStations().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
  }
  
  // Group stations by firm
  static getFirms(): Firm[] {
    const stations = this.getStations();
    const firmMap = new Map<string, Station[]>();
    
    stations.forEach(station => {
      const key = station.firmName;
      if (!firmMap.has(key)) {
        firmMap.set(key, []);
      }
      firmMap.get(key)!.push(station);
    });
    
    const firms: Firm[] = [];
    firmMap.forEach((stationList, firmName) => {
      const totalSum = stationList.reduce((sum, s) => sum + this.convertToAMD(s.monthlySum, s.currency), 0);
      const totalProcessors = stationList.reduce((sum, s) => sum + s.processorCount, 0);
      const totalPistols = stationList.reduce((sum, s) => sum + s.pistolCount, 0);
      const avgDiscount = stationList.reduce((sum, s) => sum + s.discount, 0) / stationList.length;
      
      const activeCount = stationList.filter(s => new Date(s.licenseDate) > new Date()).length;
      let status: 'active' | 'mixed' | 'inactive' = 'active';
      if (activeCount === 0) status = 'inactive';
      else if (activeCount < stationList.length) status = 'mixed';
      
      const oldestSyncDate = stationList.reduce((oldest, s) => 
        new Date(s.syncDate) < new Date(oldest) ? s.syncDate : oldest, stationList[0].syncDate);
      
      const prepayment = stationList.reduce((sum, s) => sum + s.prepayment, 0);
      
      firms.push({
        firmName,
        ownerName: stationList[0].ownerName,
        stations: stationList,
        totalSum,
        totalProcessors,
        totalPistols,
        avgDiscount,
        status,
        oldestSyncDate,
        prepayment
      });
    });
    
    return firms;
  }
  
  // Fuel Types
  static getFuelTypes(): FuelType[] {
    const data = localStorage.getItem(STORAGE_KEYS.FUEL_TYPES);
    return data ? JSON.parse(data) : this.getDefaultFuelTypes();
  }
  
  static saveFuelType(fuelType: FuelType): void {
    const fuelTypes = this.getFuelTypes();
    const index = fuelTypes.findIndex(f => f.id === fuelType.id);
    if (index >= 0) {
      fuelTypes[index] = fuelType;
    } else {
      fuelTypes.push(fuelType);
    }
    localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(fuelTypes));
  }
  
  static deleteFuelType(id: number): boolean {
    const stations = this.getStations();
    const inUse = stations.some(s => s.selectedFuelTypes.includes(id));
    if (inUse) return false;
    
    const fuelTypes = this.getFuelTypes().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(fuelTypes));
    return true;
  }
  
  // Currency Rates
  static getCurrencyRates(): CurrencyRate[] {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENCY_RATES);
    return data ? JSON.parse(data) : this.getDefaultCurrencyRates();
  }
  
  static saveCurrencyRate(rate: CurrencyRate): void {
    const rates = this.getCurrencyRates();
    const index = rates.findIndex(r => r.currency === rate.currency);
    if (index >= 0) {
      rates[index] = rate;
    } else {
      rates.push(rate);
    }
    localStorage.setItem(STORAGE_KEYS.CURRENCY_RATES, JSON.stringify(rates));
  }
  
  // Events
  static getEvents(): Event[] {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data, this.dateReviver) : [];
  }
  
  static saveEvent(event: Event): void {
    const events = this.getEvents();
    events.unshift(event);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }
  
  static markEventAsRead(id: string): void {
    const events = this.getEvents();
    const event = events.find(e => e.id === id);
    if (event) {
      event.read = true;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }
  }
  
  // Helper: Convert currency to AMD
  static convertToAMD(amount: number, currency: string): number {
    if (currency === 'AMD') return amount;
    const rates = this.getCurrencyRates();
    const rate = rates.find(r => r.currency === currency);
    return rate ? amount * rate.rate : amount;
  }
  
  // Helper: Generate ID
  static generateID(): string {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 9000) + 251;
    return `${month}${year}${random}`;
  }
  
  // Date reviver for JSON.parse
  private static dateReviver(key: string, value: any): any {
    if (key === 'licenseDate' || key === 'syncDate' || key === 'date' || key === 'oldestSyncDate') {
      return new Date(value);
    }
    return value;
  }
  
  // Default data
  private static getDefaultStations(): Station[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead
    const recentDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days ahead (approaching deadline)
    const expiredDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago (expired)
    const veryExpiredDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
    
    const recentSync = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const oldSync = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const veryOldSync = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    
    return [
      // Petrol Plus - Large active network
      {
        id: '10244512',
        firmName: 'Petrol Plus',
        ownerName: 'Арам Петросян',
        responsibleName: 'Гарик Саркисян',
        responsibleDescription: 'Технический директор',
        responsibleContacts: ['+374 91 555 123', 'garik@petrolplus.am'],
        firmContacts: ['+374 10 555 000', 'info@petrolplus.am', '+374 91 555 000'],
        country: 'Армения',
        city: 'Ереван',
        address: 'ул. Маршала Баграмяна 15',
        processorCount: 2,
        pistolCount: 12,
        currency: 'AMD',
        discount: 5,
        price: 5000,
        monthlySum: 60000,
        prepayment: 30000,
        licenseDate: futureDate,
        syncDate: recentSync,
        macAddress: '00:1B:44:11:3A:B2',
        desktopKey: 'DK-2024-PP-001',
        processorKey: 'PK-2024-PP-001',
        protectionKey: 'PR-2024-PP-001',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 0,
        fuelTypeCount: 6,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [2, 3, 4, 5, 7, 8]
      },
      {
        id: '10244513',
        firmName: 'Petrol Plus',
        ownerName: 'Арам Петросян',
        responsibleName: 'Гарик Саркисян',
        responsibleDescription: 'Технический директор',
        responsibleContacts: ['+374 91 555 123', 'garik@petrolplus.am'],
        firmContacts: ['+374 10 555 000', 'info@petrolplus.am', '+374 91 555 000'],
        country: 'Армения',
        city: 'Гюмри',
        address: 'пр. Гарегина Нжде 89',
        processorCount: 1,
        pistolCount: 8,
        currency: 'AMD',
        discount: 5,
        price: 5000,
        monthlySum: 40000,
        prepayment: 20000,
        licenseDate: futureDate,
        syncDate: recentSync,
        macAddress: '00:1B:44:11:3A:B3',
        desktopKey: 'DK-2024-PP-002',
        processorKey: 'PK-2024-PP-002',
        protectionKey: 'PR-2024-PP-002',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 0,
        fuelTypeCount: 5,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [2, 3, 4, 7, 8]
      },
      {
        id: '10244514',
        firmName: 'Petrol Plus',
        ownerName: 'Арам Петросян',
        responsibleName: 'Гарик Саркисян',
        responsibleDescription: 'Технический директор',
        responsibleContacts: ['+374 91 555 123', 'garik@petrolplus.am'],
        firmContacts: ['+374 10 555 000', 'info@petrolplus.am', '+374 91 555 000'],
        country: 'Армения',
        city: 'Ванадзор',
        address: 'ул. Тиграна Меца 45',
        processorCount: 1,
        pistolCount: 6,
        currency: 'AMD',
        discount: 5,
        price: 5000,
        monthlySum: 30000,
        prepayment: 15000,
        licenseDate: recentDate,
        syncDate: oldSync,
        macAddress: '00:1B:44:11:3A:B4',
        desktopKey: 'DK-2024-PP-003',
        processorKey: 'PK-2024-PP-003',
        protectionKey: 'PR-2024-PP-003',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 0,
        seasonChangeEvents: 0,
        fuelTypeCount: 4,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [2, 3, 7, 8]
      },
      
      // Eco Fuel - Medium network with mixed status
      {
        id: '09244001',
        firmName: 'Eco Fuel',
        ownerName: 'Вазген Манукян',
        responsibleName: 'Тигран Акопян',
        responsibleDescription: 'Главный инженер',
        responsibleContacts: ['+374 93 777 555', 't.akopyan@ecofuel.am'],
        firmContacts: ['+374 10 777 888', 'contact@ecofuel.am'],
        country: 'Армения',
        city: 'Ереван',
        address: 'пр. Адмирала Исакова 23',
        processorCount: 2,
        pistolCount: 10,
        currency: 'AMD',
        discount: 8,
        price: 5000,
        monthlySum: 50000,
        prepayment: 25000,
        licenseDate: futureDate,
        syncDate: recentSync,
        macAddress: '00:1B:44:22:4C:A1',
        desktopKey: 'DK-2024-EF-001',
        processorKey: 'PK-2024-EF-001',
        protectionKey: 'PR-2024-EF-001',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 1,
        fuelTypeCount: 5,
        fixShiftCount: 1,
        receiptCoefficient: 1,
        seasonCount: 4,
        selectedFuelTypes: [3, 4, 5, 7, 8]
      },
      {
        id: '09244002',
        firmName: 'Eco Fuel',
        ownerName: 'Вазген Манукян',
        responsibleName: 'Тигран Акопян',
        responsibleDescription: 'Главный инженер',
        responsibleContacts: ['+374 93 777 555', 't.akopyan@ecofuel.am'],
        firmContacts: ['+374 10 777 888', 'contact@ecofuel.am'],
        country: 'Армения',
        city: 'Эчмиадзин',
        address: 'ул. Комитаса 12',
        processorCount: 1,
        pistolCount: 8,
        currency: 'AMD',
        discount: 8,
        price: 5000,
        monthlySum: 40000,
        prepayment: 0, // No prepayment
        licenseDate: expiredDate, // Expired!
        syncDate: veryOldSync,
        macAddress: '00:1B:44:22:4C:A2',
        desktopKey: 'DK-2024-EF-002',
        processorKey: 'PK-2024-EF-002',
        protectionKey: 'PR-2024-EF-002',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 0,
        fuelTypeCount: 4,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [3, 4, 7, 8]
      },
      
      // АвтоГаз Сочи - Russian station with RUB
      {
        id: '08235678',
        firmName: 'АвтоГаз Сочи',
        ownerName: 'Игорь Волков',
        responsibleName: 'Дмитрий Козлов',
        responsibleDescription: 'Управляющий станцией',
        responsibleContacts: ['+7 918 555 7788', 'd.kozlov@avtogaz-sochi.ru'],
        firmContacts: ['+7 862 555 0000', 'info@avtogaz-sochi.ru'],
        country: 'Россия',
        city: 'Сочи',
        address: 'Курортный проспект 105',
        processorCount: 3,
        pistolCount: 16,
        currency: 'RUB',
        discount: 10,
        price: 500,
        monthlySum: 8000,
        prepayment: 4000,
        licenseDate: futureDate,
        syncDate: recentSync,
        macAddress: '00:1B:44:33:5D:C5',
        desktopKey: 'DK-2024-AG-001',
        processorKey: 'PK-2024-AG-001',
        protectionKey: 'PR-2024-AG-001',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 1,
        fuelTypeCount: 7,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 4,
        selectedFuelTypes: [2, 3, 4, 5, 7, 8, 9]
      },
      {
        id: '08235679',
        firmName: 'АвтоГаз Сочи',
        ownerName: 'Игорь Волков',
        responsibleName: 'Дмитрий Козлов',
        responsibleDescription: 'Управляющий станцией',
        responsibleContacts: ['+7 918 555 7788', 'd.kozlov@avtogaz-sochi.ru'],
        firmContacts: ['+7 862 555 0000', 'info@avtogaz-sochi.ru'],
        country: 'Россия',
        city: 'Адлер',
        address: 'ул. Ленина 234',
        processorCount: 2,
        pistolCount: 10,
        currency: 'RUB',
        discount: 10,
        price: 500,
        monthlySum: 5000,
        prepayment: 2500,
        licenseDate: futureDate,
        syncDate: oldSync,
        macAddress: '00:1B:44:33:5D:C6',
        desktopKey: 'DK-2024-AG-002',
        processorKey: 'PK-2024-AG-002',
        protectionKey: 'PR-2024-AG-002',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 0,
        fuelTypeCount: 5,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [2, 3, 4, 7, 8]
      },
      
      // Tbilisi Fuel Co - Georgian station with GEL
      {
        id: '07248899',
        firmName: 'Tbilisi Fuel Co',
        ownerName: 'Георгий Лобжанидзе',
        responsibleName: 'Давид Цинцадзе',
        responsibleDescription: 'Директор',
        responsibleContacts: ['+995 599 555 777', 'd.tsintadze@tbifuel.ge'],
        firmContacts: ['+995 32 555 0000', 'office@tbifuel.ge'],
        country: 'Грузия',
        city: 'Тбилиси',
        address: 'пр. Давида Агмашенебели 178',
        processorCount: 2,
        pistolCount: 12,
        currency: 'GEL',
        discount: 7,
        price: 30,
        monthlySum: 360,
        prepayment: 180,
        licenseDate: recentDate, // Expires soon
        syncDate: recentSync,
        macAddress: '00:1B:44:44:6E:D7',
        desktopKey: 'DK-2024-TF-001',
        processorKey: 'PK-2024-TF-001',
        protectionKey: 'PR-2024-TF-001',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 0,
        fuelTypeCount: 6,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [2, 3, 4, 5, 7, 8]
      },
      
      // Ararat Oil - Small independent station
      {
        id: '10251234',
        firmName: 'Ararat Oil',
        ownerName: 'Саргис Арутюнян',
        firmContacts: ['+374 94 888 999', 'ararat.oil@mail.am'],
        country: 'Армения',
        city: 'Арарат',
        address: 'ул. Ереванское шоссе 5',
        processorCount: 1,
        pistolCount: 4,
        currency: 'AMD',
        discount: 0,
        price: 5000,
        monthlySum: 20000,
        prepayment: 20000, // Full prepayment
        licenseDate: futureDate,
        syncDate: recentSync,
        macAddress: '00:1B:44:55:7F:E8',
        desktopKey: 'DK-2024-AO-001',
        processorKey: 'PK-2024-AO-001',
        protectionKey: 'PR-2024-AO-001',
        shiftChangeEvents: 0,
        calibrationChangeEvents: 0,
        seasonChangeEvents: 0,
        fuelTypeCount: 3,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 1,
        selectedFuelTypes: [2, 3, 7]
      },
      
      // Fast Fuel - Expired station needing attention
      {
        id: '06239876',
        firmName: 'Fast Fuel',
        ownerName: 'Рафаэль Григорян',
        responsibleName: 'Арсен Мартиросян',
        responsibleDescription: 'Технический специалист',
        responsibleContacts: ['+374 99 333 444'],
        firmContacts: ['+374 10 333 555', 'fastfuel@mail.am'],
        country: 'Армения',
        city: 'Ереван',
        address: 'ул. Абовяна 52',
        processorCount: 1,
        pistolCount: 6,
        currency: 'AMD',
        discount: 3,
        price: 5000,
        monthlySum: 30000,
        prepayment: 0,
        licenseDate: veryExpiredDate, // Very expired
        syncDate: veryOldSync, // Not syncing
        macAddress: '00:1B:44:66:8A:F9',
        desktopKey: 'DK-2023-FF-001',
        processorKey: 'PK-2023-FF-001',
        protectionKey: 'PR-2023-FF-001',
        shiftChangeEvents: 0,
        calibrationChangeEvents: 0,
        seasonChangeEvents: 0,
        fuelTypeCount: 4,
        fixShiftCount: 0,
        receiptCoefficient: 0,
        seasonCount: 1,
        selectedFuelTypes: [2, 3, 7, 8]
      },
      
      // Premium Station - High-end with USD pricing
      {
        id: '10259999',
        firmName: 'Premium Station',
        ownerName: 'Карен Оганесян',
        responsibleName: 'Вардан Казарян',
        responsibleDescription: 'Операционный менеджер',
        responsibleContacts: ['+374 91 999 888', 'v.kazaryan@premium-station.am', '+374 10 999 777'],
        firmContacts: ['+374 10 999 000', 'info@premium-station.am'],
        country: 'Армения',
        city: 'Ереван',
        address: 'Северный проспект 7',
        processorCount: 3,
        pistolCount: 18,
        currency: 'USD',
        discount: 15,
        price: 10,
        monthlySum: 180,
        prepayment: 90,
        licenseDate: futureDate,
        syncDate: recentSync,
        macAddress: '00:1B:44:77:9B:AA',
        desktopKey: 'DK-2024-PS-001',
        processorKey: 'PK-2024-PS-001',
        protectionKey: 'PR-2024-PS-001',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 1,
        fuelTypeCount: 8,
        fixShiftCount: 1,
        receiptCoefficient: 1,
        seasonCount: 4,
        selectedFuelTypes: [2, 3, 4, 5, 6, 7, 8, 9]
      },
      
      // Diesel Pro - Specialized diesel station
      {
        id: '09247777',
        firmName: 'Diesel Pro',
        ownerName: 'Левон Авагян',
        firmContacts: ['+374 93 444 555', 'dieselpro@mail.am'],
        country: 'Армения',
        city: 'Абовян',
        address: 'Ереванское шоссе 34',
        processorCount: 1,
        pistolCount: 6,
        currency: 'AMD',
        discount: 5,
        price: 5000,
        monthlySum: 30000,
        prepayment: 10000,
        licenseDate: futureDate,
        syncDate: oldSync,
        macAddress: '00:1B:44:88:AC:BB',
        desktopKey: 'DK-2024-DP-001',
        processorKey: 'PK-2024-DP-001',
        protectionKey: 'PR-2024-DP-001',
        shiftChangeEvents: 1,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 0,
        fuelTypeCount: 3,
        fixShiftCount: 0,
        receiptCoefficient: 1,
        seasonCount: 2,
        selectedFuelTypes: [7, 8, 9]
      }
    ];
  }
  
  private static getDefaultFuelTypes(): FuelType[] {
    return [
      { id: 1, name: "Ռեգուլար" },
      { id: 2, name: "Ai-92" },
      { id: 3, name: "Ai-95" },
      { id: 4, name: "Ai-98" },
      { id: 5, name: "Պրեմիում" },
      { id: 6, name: "Սուպեր" },
      { id: 7, name: "Դիզել" },
      { id: 8, name: "Եվրո Դիզել" },
      { id: 9, name: "Super" }
    ];
  }
  
  private static getDefaultCurrencyRates(): CurrencyRate[] {
    return [
      { currency: 'AMD', rate: 1, pricePerPistol: 5000 },
      { currency: 'RUB', rate: 4.51, pricePerPistol: 500 },
      { currency: 'USD', rate: 397, pricePerPistol: 10 },
      { currency: 'EUR', rate: 450.4, pricePerPistol: 9 },
      { currency: 'GEL', rate: 150.4, pricePerPistol: 30 }
    ];
  }
}
