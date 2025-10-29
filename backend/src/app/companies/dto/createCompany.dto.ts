import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  ownerName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ownerValue?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  responsibleName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  responsibleValue?: string;
}