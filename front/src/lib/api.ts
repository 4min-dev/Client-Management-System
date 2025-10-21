// Mock API for server communication

import type { ServerRequest, ServerResponse0, ServerResponse1, ServerResponse2 } from './types';

export class ServerAPI {
  private static baseUrl = '/api'; // Mock endpoint
  
  // Send request to server
  static async sendRequest(request: ServerRequest): Promise<any> {
    console.log('Sending request to server:', request);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (request.askNum) {
      case 0:
        return this.getStationDetails(request.id);
      case 1:
        return this.getFuelTypes();
      case 2:
        return this.getSyncData(request.id);
      default:
        throw new Error('Invalid request type');
    }
  }
  
  // AskNum=0: Get station details (Form 7 & 8 data)
  private static async getStationDetails(id: string): Promise<ServerResponse0> {
    return {
      shiftChangeEvents: 0,
      calibrationChangeEvents: 0,
      seasonChangeEvents: 0,
      fixshiftChangeCount: 0,
      receiptCoefficient: 1,
      seasonCount: 2,
      processorCount: 1,
      gunCount: 8,
      stationTotalSum: 152340.75,
      currency: "0"
    };
  }
  
  // AskNum=1: Get fuel types
  private static async getFuelTypes(): Promise<ServerResponse1[]> {
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
  
  // AskNum=2: Get license and sync dates
  private static async getSyncData(id: string): Promise<ServerResponse2> {
    const now = new Date();
    const licenseEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    return {
      licenseEndDate: licenseEnd.toISOString(),
      serverDate: now.toISOString()
    };
  }
  
  // Send Form 7 & 8 data to server
  static async sendStationData(stationId: string, data: any): Promise<boolean> {
    console.log('Sending station data to server:', { stationId, data });
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }
  
  // Send license date to server
  static async sendLicenseDate(stationId: string, licenseDate: Date): Promise<boolean> {
    console.log('Sending license date to server:', { stationId, licenseDate });
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }
  
  // Send message to station
  static async sendMessage(stationId: string, message: string): Promise<boolean> {
    console.log('Sending message to station:', { stationId, message });
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }
  
  // Request MAC address
  static async requestMacAddress(stationId: string): Promise<string> {
    console.log('Requesting MAC address for station:', stationId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `00:1B:44:11:3A:${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  }
  
  // Generate desktop key
  static async generateDesktopKey(stationId: string): Promise<string> {
    console.log('Generating desktop key for station:', stationId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return `DK-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  // Generate processor key
  static async generateProcessorKey(stationId: string): Promise<string> {
    console.log('Generating processor key for station:', stationId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return `PK-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  // Generate protection key
  static async generateProtectionKey(stationId: string): Promise<string> {
    console.log('Generating protection key for station:', stationId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return `PR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  // Block/unblock station
  static async setStationBlock(stationId: string, blocked: boolean): Promise<boolean> {
    console.log(`${blocked ? 'Blocking' : 'Unblocking'} station:`, stationId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }
}
