import { ApiProperty } from '@nestjs/swagger';
import { IsString} from 'class-validator';

export class CreateStationMessageDto {
  @ApiProperty()
  @IsString()
  text: string;
}
