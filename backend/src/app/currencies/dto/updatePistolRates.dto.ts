import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePistolRateDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  rate?: number;
}

export class UpdatePistolRatesDto {
  @ApiProperty({ isArray: true, type: UpdatePistolRateDto })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePistolRateDto)
  rates: UpdatePistolRateDto[];
}


