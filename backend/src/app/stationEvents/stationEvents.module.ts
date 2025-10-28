import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { StationEventsService } from './stationEvents.service';
import { StationEventsController } from './stationEvents.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
    imports: [ScheduleModule.forRoot(), HttpModule],
    providers: [StationEventsService, PrismaService],
    controllers: [StationEventsController],
})
export class StationEventsModule { }