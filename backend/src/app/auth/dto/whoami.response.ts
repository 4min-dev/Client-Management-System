import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class WhoAmIResponseDto {
  id: string;
  login: string

  constructor(id: string, login: string) {
    this.id = id;
    this.login = login;
  }
}
