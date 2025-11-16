import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StationsModule } from './stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('DATABASE_HOST');
        const port = configService.get('DATABASE_PORT');
        const dbName = configService.get('DATABASE_NAME');
        console.log('Conectando a Mongo:', { host, port, dbName });
        return {
          uri: `mongodb://${host}:${port}/${dbName}`,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [ConfigService],
    }),
    StationsModule,
  ],
  providers: [],
})
export class AppModule {}
