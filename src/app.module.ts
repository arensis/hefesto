import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StationsModule } from './stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get(
          'DATABASE_HOST',
        )}:${configService.get('DATABASE_PORT')}/${configService.get(
          'DATABASE_NAME',
        )}`,
      }),
      inject: [ConfigService],
    }),
    StationsModule,
  ],
  providers: [],
})
export class AppModule {}
