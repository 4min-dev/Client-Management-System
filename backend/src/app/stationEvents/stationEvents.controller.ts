import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { StationEventsService } from './stationEvents.service';
import { EventType } from '@prisma/client';

@Controller('events')
export class StationEventsController {
    constructor(private readonly service: StationEventsService) { }

    @Get()
    async getEvents(
        @Query('stationId') stationId?: string,
        @Query('companyId') companyId?: string,
        @Query('type') type?: EventType,
        @Query('viewed') viewed?: string,
    ) {
        return this.service.getEvents(
            stationId,
            companyId,
            type,
            viewed ? viewed === 'true' : undefined,
        );
    }

    @Get('unread/count')
    async getUnreadEventsCount(
        @Query('stationId') stationId?: string,
        @Query('companyId') companyId?: string,
    ) {
        return this.service.getUnreadEventsCount(stationId, companyId);
    }

    @Patch(':id/view')
    async markAsViewed(@Param('id') id: string) {
        return this.service.markAsViewed(id);
    }
}