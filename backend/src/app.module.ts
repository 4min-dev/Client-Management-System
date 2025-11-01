import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './app/auth/auth.module';
import { CryptoModule } from './app/crypto/crypto.module';
import { StationModule } from './app/stations/station.module';
import { UserModule } from './app/users/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyModule } from './app/companies/company.module';
import { CurrencyModule } from './app/currencies/currency.module';
import { FuelModule } from './app/fuel/fuel.module';
import { StationEventsModule } from './app/stationEvents/stationEvents.module';
import { DatabaseModule } from 'prisma/database.module';
import { NetworkModule } from './app/network/network.module';

@Module({
  imports: [
    NetworkModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    CryptoModule,
    CompanyModule,
    StationModule,
    CurrencyModule,
    FuelModule,
    StationEventsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }