import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LogIn2FADto {
  @ApiProperty()
  @IsString()
  code: string;
}
