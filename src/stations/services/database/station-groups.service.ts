import { StationGroupResponseDto } from '../../dto/station-group-response.dto';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { StationGroupDto } from '../../dto/station.group.dto';
import { StationsService } from './stations.service';
import { StationEntity } from '../../database/model/station.entity';
import {
  StationGroupEntity,
  StationGroupDocument,
} from '../../database/model/station-group.entity';
import { MeasurementMapperService } from '../mappers/measurement.mapper';
import { StationGroupResponseMapper } from '../mappers/station-group-response.mapper';
import { StationGroupMeasurementsService } from './station-group-measurements.service';
import { StationGroupMeasurementEntity } from '../../database/model/station-group-measurement.entity';
import {
  DailyRollupsService,
  AggregateResult,
} from './daily-rollups.service';
import { AggregatePeriod } from '../../dto/aggregate-query.dto';
import { DeleteResult } from 'mongodb';

@Injectable()
export class StationGroupsService {
  constructor(
    @InjectModel(StationGroupEntity.name)
    private stationGroupModel: Model<StationGroupDocument>,
    @Inject(forwardRef(() => StationsService))
    private stationsService: StationsService,
    private measurementMapper: MeasurementMapperService,
    private stationGroupResponseMapper: StationGroupResponseMapper,
    private stationGroupMeasurementsService: StationGroupMeasurementsService,
    private dailyRollupsService: DailyRollupsService,
  ) {}

  async findAll(): Promise<StationGroupResponseDto[]> {
    const stationsGroups = await this.stationGroupModel
      .find({
        $or: [
          { stationGroupId: { $exists: false } },
          { stationGroupId: { $in: [null, '', undefined] } },
        ],
      })
      .lean();

    return stationsGroups.map((stationGroup: StationGroupEntity) =>
      this.stationGroupResponseMapper.mapStationGroupResponse(stationGroup),
    );
  }

  async findById(id: string): Promise<StationGroupResponseDto> {
    const stationGroup = await this.stationGroupModel
      .findOne(
        { _id: new Types.ObjectId(id) },
        {
          location: 1,
          createdDate: 1,
          currentMeasurement: 1,
          stations: 1,
        },
      )
      .lean();

    return this.stationGroupResponseMapper.mapStationGroupResponse(
      stationGroup,
    );
  }

  async create(stationGroupDto: StationGroupDto): Promise<StationGroupEntity> {
    stationGroupDto.createdDate = new Date();
    stationGroupDto.stationsId = [];

    return await this.stationGroupModel.create(stationGroupDto);
  }

  async delete(id: string, session?: ClientSession): Promise<DeleteResult> {
    const result = await this.stationGroupModel.deleteOne(
      { _id: id },
      { session },
    );

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Station ${id} not found`);
    }

    return result;
  }

  async addMeasurement(
    stationGroupId: string,
    stations: StationEntity[],
    session: ClientSession,
  ): Promise<StationGroupEntity> {
    const groupMeasurement =
      this.measurementMapper.buildGroupStationMeasurement(stations);

    // Si no hay estaciones operativas no hay media valida: no sobreescribimos
    // la media del grupo con ceros; dejamos la ultima media conocida.
    if (!groupMeasurement) {
      const group = await this.stationGroupModel.findById(stationGroupId).lean();

      if (!group) {
        throw new NotFoundException('Station group not found');
      }

      return group as StationGroupEntity;
    }

    const updated = await this.stationGroupModel
      .findByIdAndUpdate(
        {
          _id: stationGroupId,
        },
        {
          $set: { currentMeasurement: groupMeasurement },
        },
        { new: true, lean: true, session },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Station group not found');
    }

    // Persistimos el punto en el historico del grupo (serie temporal de la media).
    await this.stationGroupMeasurementsService.create(
      stationGroupId,
      groupMeasurement,
      session,
    );

    // Rollup diario del grupo (media/min/max), incremental y FUERA de la
    // transaccion: un fallo de rollup no debe romper la propagacion/ingesta.
    try {
      await this.dailyRollupsService.applyMeasurement(
        'group',
        stationGroupId,
        groupMeasurement.date,
        groupMeasurement,
      );
    } catch (error) {
      console.error(`Error actualizando el rollup del grupo ${stationGroupId}:`, error);
    }

    return updated as StationGroupEntity;
  }

  async getAggregates(
    stationGroupId: string,
    period: AggregatePeriod,
    date: Date,
  ): Promise<AggregateResult> {
    return this.dailyRollupsService.getAggregate(
      'group',
      stationGroupId,
      period,
      date,
    );
  }

  async findMeasurementsBy(
    stationGroupId: string,
    date: Date,
    bucketMinutes?: number,
  ): Promise<StationGroupMeasurementEntity[]> {
    return this.stationGroupMeasurementsService.findMeasurementsByDay(
      stationGroupId,
      date,
      bucketMinutes,
    );
  }

  async updateStationGroup(
    stationGroupId: string,
    session?: ClientSession,
  ): Promise<StationGroupEntity> {
    const stations = await this.stationsService.findEntitiesByStationGroupId(
      stationGroupId,
    );

    return await this.addMeasurement(stationGroupId, stations, session);
  }

  async addStation(
    stationGroupId: string,
    stationId: string,
    session?: ClientSession,
  ): Promise<StationGroupEntity> {
    await this.stationsService.addStationGroupId(stationId, stationGroupId);

    await this.stationGroupModel
      .findByIdAndUpdate(
        {
          _id: stationGroupId,
        },
        { $addToSet: { stations: stationId } },
        { new: true, session },
      )
      .lean();

    const updatedGroup = await this.updateStationGroup(stationGroupId, session);

    if (!updatedGroup) {
      throw new NotFoundException(`Station group ${stationGroupId} not found`);
    }

    return updatedGroup as StationGroupEntity;
  }

  async deleteStation(
    stationGroupId: string,
    stationId: string,
    session?: ClientSession,
  ): Promise<StationGroupEntity> {
    const station = await this.stationsService.deleteStationGroupId(stationId);

    if (!station) {
      throw new NotFoundException(`Station ${stationId} not found`);
    }

    await this.stationGroupModel
      .findByIdAndUpdate(
        {
          _id: stationGroupId,
        },
        { $pull: { stations: stationId } },
        { new: true, session },
      )
      .lean();

    const updatedGroup = await this.updateStationGroup(stationGroupId, session);

    if (!updatedGroup) {
      throw new NotFoundException(`Station group ${stationGroupId} not found`);
    }

    return updatedGroup as StationGroupEntity;
  }
}
