
import { ApiProperty } from '@nestjs/swagger';
import { IsMACAddress, IsOptional, IsString } from 'class-validator';

export class UpdateStationCryptoKeyDto {
  @ApiProperty()
  @IsString()
  stationId: string;

  @ApiProperty()
  @IsString()
  @IsMACAddress()
  macAddress: string;

  @ApiProperty()
  @IsOptional()
  @IsMACAddress()
  key: string;
}
