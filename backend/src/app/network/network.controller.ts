import { Controller, Get } from '@nestjs/common';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
    constructor(private readonly networkService: NetworkService) { }

    @Get('mac')
    async getMacAddress() {
        console.log('Запрос MAC-адреса...');
        const mac = await this.networkService.getMacAddress();
        console.log('MAC получен:', mac);
        return { mac };
    }
}
