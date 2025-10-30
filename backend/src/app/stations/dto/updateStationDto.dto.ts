import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { StationStatus } from '@prisma/client';

export class UpdateStationDto {
    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    processorCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pistolCount?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discount?: number;

    @IsOptional()
    @IsString()
    responsibleName?: string;

    @IsOptional()
    @IsString()
    responsibleDescription?: string;

    @IsOptional()
    @IsEnum(StationStatus)
    status?: StationStatus;
}