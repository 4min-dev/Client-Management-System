import { ApiProperty } from '@nestjs/swagger';
import { IsMACAddress, IsString } from 'class-validator';

export class CreateStationCryptoKeyDto {
  @ApiProperty()
  @IsString()
  stationId: string;

  @ApiProperty()
  @IsString()
  @IsMACAddress()
  macAddress: string;

  @ApiProperty()
  @IsString()
  key?: string
}
