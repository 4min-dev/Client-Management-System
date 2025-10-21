import { Fuel } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateExchangeRateDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  rate?: number;
}


export class UpdateExchangeRatesDto {
  @ApiProperty({ isArray: true, type: UpdateExchangeRateDto })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExchangeRateDto)
  rates: UpdateExchangeRateDto[];
}


