import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as macaddress from 'macaddress';

@Injectable()
export class NetworkService {
    private mac: string | null = null;

    async getMacAddress(): Promise<string> {
        if (this.mac) return this.mac;

        try {
            const mac = await macaddress.one();
            if (!mac || mac === '00:00:00:00:00:00') {
                throw new Error('Invalid or empty MAC address');
            }
            this.mac = mac;
            return mac;
        } catch (error) {
            console.error('Failed to get MAC address:', error);
            throw new InternalServerErrorException(
                'Не удалось получить MAC-адрес сервера. Проверьте сетевые интерфейсы.',
            );
        }
    }
}