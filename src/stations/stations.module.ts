import { StationMeasurementsService } from './services/database/station-measurements.service';
import { Module } from '@nestjs/common';
import { StationsController } from './controllers/stations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StationEntity, StationSchema } from './database/model/station.entity';
import { StationGroupsService } from './services/database/station-groups.service';
import { StationGroupsController } from './controllers/stations-group.controller';
import { StationsService } from './services/database/stations.service';
import {
  StationMeasurementEntity,
  StationMeasurementEntitySchema,
} from './database/model/station-measurement.entity';
import { StationGroupMeasurementsService } from './services/database/station-group-measurements.service';
import {
  StationGroupEntity,
  StationGroupSchema,
} from './database/model/station-group.entity';
import { DatabaseTransactionService } from './services/database/transactions/database-transaction.service';
import { StationGroupsOrchestrator } from './services/database/transactions/station-groups-orchestrator.service';
import { StationsOrchestratorService } from './services/database/transactions/station-orchestrator.service';
import { MeasurementMapperService } from './services/mappers/measurement.mapper';
import { StationGroupResponseMapper } from './services/mappers/station-group-response.mapper';
import { StationMapperService } from './services/mappers/station.mapper';
import { MeasurementsCalculationService } from './services/measurements-calculations.service';
import {
  StationGroupMeasurementEntity,
  StationGroupMeasurementEntitySchema,
} from './database/model/station-group-measurement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StationEntity.name, schema: StationSchema },
      { name: StationGroupEntity.name, schema: StationGroupSchema },
      {
        name: StationMeasurementEntity.name,
        schema: StationMeasurementEntitySchema,
      },
      {
        name: StationGroupMeasurementEntity.name,
        schema: StationGroupMeasurementEntitySchema,
      },
    ]),
  ],
  controllers: [StationsController, StationGroupsController],
  providers: [
    StationsService,
    StationGroupsService,
    StationMeasurementsService,
    StationGroupMeasurementsService,
    DatabaseTransactionService,
    StationGroupsOrchestrator,
    StationsOrchestratorService,
    MeasurementMapperService,
    StationGroupResponseMapper,
    StationMapperService,
    MeasurementsCalculationService,
  ],
})
export class StationsModule {}
