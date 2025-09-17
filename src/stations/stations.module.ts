import { StationsService } from './services/stations.service';
import { Module } from '@nestjs/common';
import { StationsController } from './controllers/stations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StationEntity, StationSchema } from './database/model/station.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StationEntity.name, schema: StationSchema },
    ]),
  ],
  controllers: [StationsController],
  providers: [StationsService],
})
export class StationsModule {}
