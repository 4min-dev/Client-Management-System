import {
  Body,
  Controller,
  Get, Inject, Param, Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CryptoService } from '../crypto/crypto.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CompanyService } from './company.service';
import { CreateCompanyMessageDto } from './dto/createCompanyMessage.dto';
import { StationService } from '../stations/station.service';

@Controller('company')
export class CompanyController {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private companyService: CompanyService,
    private stationService: StationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
  }

  @Get('/list')
  async getCompanies() {
    return this.companyService.getAll();
  }

  @Get(`/messages/:companyId/send`)
  async sendMessages(@Param('companyId') id: string, @Body() body: CreateCompanyMessageDto) {
    const company = await this.companyService.getById(id);

    await Promise.all(company.stations.map(async station => await this.stationService.createMessage(station.id, { text: body.text })));
  }

  @Post('/update/:id')
  async updateCompany(@Param('id') id: string, @Body() body) {
    return this.companyService.update({
      id: id,
      name: body.name,
      description: body.description,
    });
  }
}
