import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteStationDto {
    @IsNotEmpty({ message: 'Пароль обязателен' })
    @IsString()
    password: string
}