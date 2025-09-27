import { Module } from '@nestjs/common';
import { StationsController } from './controllers/stations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StationEntity, StationSchema } from './database/model/station.entity';
import {
  StationGroupEntity,
  StationGroupSchema,
} from './database/station-group.entity';
import { StationGroupsService } from './services/station-groups.service';
import { StationGroupsController } from './controllers/stations-group.controller';
import { StationsService } from './services/stations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StationEntity.name, schema: StationSchema },
      { name: StationGroupEntity.name, schema: StationGroupSchema },
    ]),
  ],
  controllers: [StationsController, StationGroupsController],
  providers: [StationsService, StationGroupsService],
})
export class StationsModule {}
