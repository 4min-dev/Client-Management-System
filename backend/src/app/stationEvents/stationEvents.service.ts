import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { addDays, differenceInDays } from 'date-fns';
import { Cron } from '@nestjs/schedule';
import { EventType } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StationEventsService {
    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
    ) { }

    async getEvents(
        stationId?: string,
        companyId?: string,
        type?: EventType,
        viewed?: boolean,
    ) {
        if (companyId) {
            const stations = await this.prisma.station.findMany({
                where: { companyId },
                select: { id: true },
            });
            const stationIds = stations.map((station) => station.id);

            return this.prisma.stationEvent.findMany({
                where: {
                    stationId: { in: stationIds },
                    type,
                    viewed,
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    station: {
                        include: {
                            company: true,
                        },
                    },
                },
            });
        }

        return this.prisma.stationEvent.findMany({
            where: {
                stationId,
                type,
                viewed,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                station: {
                    include: {
                        company: true,
                    },
                },
            },
        });
    }

    async getUnreadEventsCount(stationId?: string, companyId?: string) {
        if (companyId) {
            const stations = await this.prisma.station.findMany({
                where: { companyId },
                select: { id: true },
            });
            const stationIds = stations.map((station) => station.id);

            return this.prisma.stationEvent.count({
                where: {
                    stationId: { in: stationIds },
                    viewed: false,
                },
            });
        }

        return this.prisma.stationEvent.count({
            where: {
                stationId,
                viewed: false,
            },
        });
    }

    async markAsViewed(id: string) {
        return this.prisma.stationEvent.update({
            where: { id },
            data: { viewed: true },
        });
    }

    @Cron('0 0 * * *')
    async handleCron() {
        console.log('Cron triggered at', new Date().toISOString());
        try {
            await this.generateEvents();
            console.log('generateEvents completed at', new Date().toISOString());
        } catch (error) {
            console.error('Error in handleCron:', error);
        }
    }

    async generateEvents() {
        console.log('Starting generateEvents at', new Date().toISOString());
        try {
            const stations = await this.prisma.station.findMany({
                include: { company: true },
            });
            console.log('Found stations:', stations.length);

            const serverUrl = this.configService.get<string>('SERVER_URL') || 'http://localhost:3000/api/events';

            for (const station of stations) {
                const events: { type: EventType; message: string }[] = [];
                console.log(`Processing station ${station.id}`);

                if (station.paidUntil) {
                    const diffDays = differenceInDays(station.paidUntil, new Date());
                    console.log(`Station ${station.id} paidUntil diff: ${diffDays} days`);
                    if (diffDays === 3) {
                        events.push({
                            type: EventType.LICENSE_EXPIRE_SOON_3DAYS,
                            message: `До истечения срока лицензии станции "${station.company.name}" осталось 3 дня.`,
                        });
                    } else if (diffDays === 1) {
                        events.push({
                            type: EventType.LICENSE_EXPIRE_SOON_1DAY,
                            message: `До истечения срока лицензии станции "${station.company.name}" остался 1 день.`,
                        });
                    } else if (diffDays === 0) {
                        events.push({
                            type: EventType.LICENSE_EXPIRED,
                            message: `Срок лицензии станции "${station.company.name}" истёк.`,
                        });
                    } else if (diffDays === -5) {
                        events.push({
                            type: EventType.LICENSE_BLOCK_PARTIAL,
                            message: `Срок лицензии станции "${station.company.name}" истёк 5 дней назад. Устройство частично заблокировано.`,
                        });
                    } else if (diffDays === -30) {
                        events.push({
                            type: EventType.LICENSE_BLOCK_FULL,
                            message: `Станция "${station.company.name}" заблокирована. Просрочка лицензии 30 дней.`,
                        });
                    }
                }

                if (station.synchronize) {
                    const daysSinceSync = differenceInDays(new Date(), station.synchronize);
                    console.log(`Station ${station.id} synchronize diff: ${daysSinceSync} days`);
                    if (daysSinceSync === 1) {
                        events.push({
                            type: EventType.SYNC_MISSING_1DAY,
                            message: `Обновление базы станции "${station.company.name}" не осуществлено (1 день без связи).`,
                        });
                    } else if (daysSinceSync === 2) {
                        events.push({
                            type: EventType.SYNC_MISSING_2DAYS,
                            message: `Девайс "${station.company.name}" частично заблокирован (2 дня без связи).`,
                        });
                    } else if (daysSinceSync >= 3) {
                        events.push({
                            type: EventType.SYNC_MISSING_3DAYS,
                            message: `Девайс "${station.company.name}" заблокирован (3 дня без связи).`,
                        });
                    }
                }

                for (const e of events) {
                    const exists = await this.prisma.stationEvent.findFirst({
                        where: {
                            stationId: station.id,
                            type: e.type,
                            viewed: false,
                        },
                    });

                    if (!exists) {
                        const newEvent = await this.prisma.stationEvent.create({
                            data: {
                                type: e.type,
                                message: e.message,
                                stationId: station.id,
                            },
                        });
                        console.log(`Created event: ${e.type} for station ${station.id}`);

                        try {
                            const response = await firstValueFrom(
                                this.httpService.post(serverUrl, {
                                    id: newEvent.id,
                                    stationId: station.id,
                                    type: e.type,
                                    message: e.message,
                                    createdAt: newEvent.createdAt.toISOString(),
                                    ip: '127.0.0.1',
                                    macAddress: station.macAddress || '',
                                    state: 0,
                                }),
                            );
                            console.log(
                                `Event ${e.type} for station ${station.id} sent to server successfully: HTTP ${response.status}`,
                            );
                        } catch (error) {
                            console.error(`Failed to send event ${e.type} for station ${station.id} to server: ${error.message}`);
                        }
                    } else {
                        console.log(`Event ${e.type} for station ${station.id} already exists, skipping creation`);
                        console.log(`No attempt to send existing event ${e.type} for station ${station.id} to server`);
                    }
                }
            }
            console.log('Finished generateEvents at', new Date().toISOString());
        } catch (error) {
            console.error('Error in generateEvents:', error);
        }
    }
}