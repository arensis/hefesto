import { StationsService } from './stations.service';
import { StationEntity, StationSchema } from './database/station.entity';
import { Module } from '@nestjs/common';
import { StationsController } from './stations.controller';
import { MongooseModule } from '@nestjs/mongoose';

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
