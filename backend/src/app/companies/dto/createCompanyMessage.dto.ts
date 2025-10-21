import { ApiProperty } from '@nestjs/swagger';
import { IsMACAddress, IsString} from 'class-validator';

export class CreateCompanyMessageDto {
  @ApiProperty()
  @IsString()
  text: string;
}
