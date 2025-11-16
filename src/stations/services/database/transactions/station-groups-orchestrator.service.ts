import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseTransactionService } from './database-transaction.service';
import { StationGroupMeasurementsService } from '../station-group-measurements.service';
import { StationGroupsService } from '../station-groups.service';
import { StationMeasurementsService } from '../station-measurements.service';
import { StationsService } from '../stations.service';
import { StationGroupEntity } from 'src/stations/database/model/station-group.entity';
import { DeleteResult } from 'mongodb';

@Injectable()
export class StationGroupsOrchestrator {
  constructor(
    private readonly databaseTransactionService: DatabaseTransactionService,
    private readonly stationGroupsService: StationGroupsService,
    private readonly stationsService: StationsService,
    private readonly stationGroupMeasurementsService: StationGroupMeasurementsService,
    private readonly stationMeasurementsService: StationMeasurementsService,
  ) {}

  async deleteGroupWithDependencies(groupId: string): Promise<DeleteResult> {
    return this.databaseTransactionService.execute(async (session) => {
      const group = await this.stationGroupsService.findById(groupId);
      if (!group)
        throw new NotFoundException(`Station group ${groupId} not found`);

      const stations = group.stations ?? [];
      for (const stationId of stations) {
        await this.stationsService.deleteStationGroupId(stationId, session);
      }

      await this.stationGroupMeasurementsService.deleteByStationId(
        groupId,
        session,
      );

      const deletionAction = await this.stationGroupsService.delete(
        groupId,
        session,
      );

      if (deletionAction.deletedCount === 0)
        throw new NotFoundException(`Station group ${groupId} not found`);

      return deletionAction;
    });
  }

  async addStationToGroupTransactional(
    groupId: string,
    stationId: string,
  ): Promise<StationGroupEntity> {
    return this.databaseTransactionService.execute(async (session) => {
      await this.stationsService.addStationGroupId(stationId, groupId, session);

      return await this.stationGroupsService.addStation(
        groupId,
        stationId,
        session,
      );
    });
  }

  async deleteStationFromGroupTransactional(
    stationGroupId: string,
    stationId: string,
  ): Promise<StationGroupEntity> {
    return this.databaseTransactionService.execute(async (session) => {
      return await this.stationGroupsService.deleteStation(
        stationGroupId,
        stationId,
        session,
      );
    });
  }
}
