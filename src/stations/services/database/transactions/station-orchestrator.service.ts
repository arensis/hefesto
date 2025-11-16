import { Injectable, NotFoundException } from '@nestjs/common';
import { StationMeasurementDto } from '../../../dto/station-measurement.dto';
import { DatabaseTransactionService } from './database-transaction.service';
import { StationMeasurementsService } from '../station-measurements.service';
import { StationsService } from '../stations.service';

@Injectable()
export class StationsOrchestratorService {
  constructor(
    private readonly databaseTransactionService: DatabaseTransactionService,
    private readonly stationsService: StationsService,
    private readonly measurementsService: StationMeasurementsService,
  ) {}

  async deleteStationWithMeasurements(stationId: string) {
    return this.databaseTransactionService.execute(async (session) => {
      await this.measurementsService.deleteByStationId(stationId, session);
      const deletionAction = await this.stationsService.delete(
        stationId,
        session,
      );

      if (deletionAction.deletedCount === 0) {
        throw new NotFoundException(`Station ${stationId} not found`);
      }

      return deletionAction;
    });
  }

  async addMeasurementAndPropagate(
    stationId: string,
    measurementDto: StationMeasurementDto,
  ) {
    return this.databaseTransactionService.execute(async (session) => {
      return await this.stationsService.addMeasurement(
        stationId,
        measurementDto,
        session,
      );
    });
  }
}
