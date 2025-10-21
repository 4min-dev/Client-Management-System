import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { CurrencyType } from '@prisma/client';

export class CreateStationDto {
  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNumber()
  procCount: number;

  @ApiProperty()
  @IsNumber()
  pistolCount: number;

  @ApiProperty()
  @IsEnum(CurrencyType)
  currencyType: CurrencyType;

  @ApiProperty()
  @IsNumber()
  discount: number;

  @ApiProperty()
  @IsString()
  ownerCompanyName: string;

  @ApiProperty()
  @IsString()
  ownerCompanyDescription: string;

  @ApiProperty()
  @IsString()
  contactName: string;

  @ApiProperty()
  @IsString()
  contactDescription: string;
}
