// Generate events based on station data

import type { Event, Station } from './types';

export class EventGenerator {
  static generateEventsForStation(station: Station): Event[] {
    const events: Event[] = [];
    const now = new Date();
    
    // License expiration events
    const licenseDate = new Date(station.licenseDate);
    const daysUntilExpiry = Math.floor((licenseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry === 3) {
      events.push(this.createEvent(station, 'До истечения срока лицензии осталось 3 дня', now));
    }
    
    if (daysUntilExpiry === 1) {
      events.push(this.createEvent(station, 'До истечения срока лицензии осталось 1 день', now));
    }
    
    if (daysUntilExpiry <= 0) {
      events.push(this.createEvent(station, 'Срок лицензии истёк', now));
    }
    
    if (daysUntilExpiry <= -5) {
      events.push(this.createEvent(station, 'Девайс частично заблокирован (5 дней без лицензии)', now));
    }
    
    if (daysUntilExpiry <= -30) {
      events.push(this.createEvent(station, 'Девайс заблокирован (1 месяц без лицензии)', now));
    }
    
    // Synchronization events
    const syncDate = new Date(station.syncDate);
    const daysSinceSync = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceSync >= 1) {
      events.push(this.createEvent(station, 'Обновление базы не осуществлено: нету связи 1 день', now));
    }
    
    if (daysSinceSync >= 2) {
      events.push(this.createEvent(station, 'Девайс частично заблокирован: нету связи 2 дня', now));
    }
    
    if (daysSinceSync >= 3) {
      events.push(this.createEvent(station, 'Девайс заблокирован: нету связи 3 дня', now));
    }
    
    return events;
  }
  
  private static createEvent(station: Station, eventName: string, date: Date): Event {
    return {
      id: `${station.id}-${Date.now()}-${Math.random()}`,
      stationId: station.id,
      firmName: station.firmName,
      ownerName: station.ownerName,
      country: station.country,
      city: station.city,
      address: station.address,
      responsible: station.responsibleName || '',
      eventType: this.getEventType(eventName),
      eventName,
      date,
      read: false
    };
  }
  
  private static getEventType(eventName: string): string {
    if (eventName.includes('лицензии')) return 'license';
    if (eventName.includes('связи')) return 'sync';
    if (eventName.includes('блокирован')) return 'block';
    return 'other';
  }
}
