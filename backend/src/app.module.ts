import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/app/auth/auth.module';
import { CryptoModule } from 'src/app/crypto/crypto.module';
import { StationModule } from 'src/app/stations/station.module';
import { UserModule } from 'src/app/users/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyModule } from './app/companies/company.module';
import { CurrencyModule } from './app/currencies/currency.module';
import { FuelModule } from './app/fuel/fuel.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    CryptoModule,
    CompanyModule,
    StationModule,
    CurrencyModule,
    FuelModule,
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
export class AppModule {
}
