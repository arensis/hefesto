import { StationGroupResponseDto } from '../../dto/station-group-response.dto';
import {
  BadRequestException,
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

    if ((groupMeasurement?.temperature || 0) <= 0) {
      throw new BadRequestException('Temperature cannot be 0 or null');
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

    return updated as StationGroupEntity;
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
