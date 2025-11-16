import { StationDto } from '../../dto/station.dto';
import { MeasurementDto } from '../../dto/measurement.dto';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  StationEntity,
  StationDocument,
} from '../../database/model/station.entity';
import { StationResponseDto } from '../../dto/station-response.dto';
import { StationGroupsService } from './station-groups.service';
import { StationMeasurementsService } from './station-measurements.service';
import { StationMeasurementEntity } from '../../database/model/station-measurement.entity';
import { MeasurementMapperService } from '../mappers/measurement.mapper';
import { StationMapperService } from '../mappers/station.mapper';

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(StationEntity.name)
    private stationModel: Model<StationDocument>,
    @Inject(forwardRef(() => StationGroupsService))
    private readonly stationGroupsService: StationGroupsService,
    @Inject(forwardRef(() => StationMeasurementsService))
    private readonly stationMeasurementsService: StationMeasurementsService,
    private measurementMapper: MeasurementMapperService,
    private stationMapper: StationMapperService,
  ) {}

  async findAllNotGrouped(): Promise<StationResponseDto[]> {
    const stations = await this.stationModel
      .find({
        $or: [
          { stationGroupId: { $exists: false } },
          { stationGroupId: { $in: [null, '', undefined] } },
        ],
      })
      .select('-measurements')
      .lean();

    return stations.map((station: StationEntity) =>
      this.stationMapper.mapStationResponseDto(station),
    );
  }

  async findAll(): Promise<StationResponseDto[]> {
    const stations = await this.stationModel
      .find({
        stationsGroupId: { $in: [null, '', undefined] },
      })
      .select('location createdDate stationGroupId currentMeasurement')
      .lean();

    return stations.map((station: StationEntity) =>
      this.stationMapper.mapStationResponseDto(station),
    );
  }

  async findById(id: string): Promise<StationResponseDto> {
    const station = await this.stationModel
      .findById(id)
      .select('-measurements')
      .lean()
      .exec();

    return this.stationMapper.mapStationResponseDto(station);
  }

  async findByStationGroupId(
    stationGroupId: string,
  ): Promise<StationResponseDto[]> {
    const stations = await this.stationModel
      .find({ stationGroupId })
      .select('location createdDate stationGroupId currentMeasurement')
      .lean();

    return stations.map((station: StationEntity) =>
      this.stationMapper.mapStationResponseDto(station),
    );
  }

  async findEntitiesByStationGroupId(
    stationGroupId: string,
  ): Promise<StationEntity[]> {
    return await this.stationModel
      .find({ stationGroupId })
      .select('location createdDate stationGroupId currentMeasurement')
      .lean();
  }

  async findByIdWithCurrentDayMeasurements(
    id: string,
  ): Promise<StationResponseDto> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const station = await this.stationModel
      .findOne(
        { _id: id },
        {
          location: 1,
          createdDate: 1,
          stationGroupId: 1,
          currentMeasurement: 1,
          measurements: {
            $filter: {
              input: '$measurements',
              as: 'm',
              cond: {
                $and: [
                  { $gte: ['$$m.date', startDate] },
                  { $lt: ['$$m.date', endDate] },
                ],
              },
            },
          },
        },
      )
      .lean();

    if (!station) throw new NotFoundException('Not found station ' + id);

    return this.stationMapper.mapStationResponseDto(station);
  }

  async findMeasurementsBy(
    stationId: string,
    measurementDate: Date,
  ): Promise<MeasurementDto[]> {
    const measurements =
      await this.stationMeasurementsService.findMeasurementsByDay(
        stationId,
        measurementDate,
      );

    return measurements.map((entity: StationMeasurementEntity) =>
      this.measurementMapper.mapStationMeasurementDto(entity),
    );
  }

  async create(stationDto: StationDto): Promise<StationEntity> {
    stationDto.createdDate = new Date();

    return await this.stationModel.create(stationDto);
  }

  async addMeasurement(
    stationId: string,
    measurementDto: Partial<MeasurementDto>,
    session?: ClientSession,
  ): Promise<StationResponseDto> {
    if ((measurementDto?.temperature || 0) <= 0) {
      throw new BadRequestException('Temperature cannot be 0 o null');
    }

    const measurement = {
      date: new Date(),
      temperature: measurementDto.temperature,
      humidity: measurementDto.humidity,
      airPressure: measurementDto.airPressure ?? 0,
    };

    await this.stationMeasurementsService.create(
      stationId,
      measurement,
      session,
    );

    const updatedStation = await this.stationModel
      .findOneAndUpdate(
        { _id: stationId },
        {
          $set: { currentMeasurement: measurement },
        },
        { new: true, session },
      )
      .lean();

    if (!updatedStation) {
      throw new NotFoundException(`Station ${stationId} not found`);
    }

    if (updatedStation.stationGroupId) {
      this.stationGroupsService.updateStationGroup(
        updatedStation.stationGroupId,
        session,
      );
    }

    return this.stationMapper.mapStationResponseDto(updatedStation);
  }

  async delete(id: string, session?: ClientSession) {
    const result = await this.stationModel.deleteOne({ _id: id }, { session });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Station ${id} not found`);
    }

    return result;
  }

  async addStationGroupId(
    id: string,
    stationGroupId: string,
    session?: ClientSession,
  ): Promise<StationEntity> {
    const updatedStation = await this.stationModel
      .findByIdAndUpdate(
        id,
        { $set: { stationGroupId } },
        { new: true, session },
      )
      .lean();

    if (!updatedStation) {
      throw new NotFoundException(`Station ${id} not found`);
    }

    return updatedStation as StationEntity;
  }

  async deleteStationGroupId(
    id: string,
    session?: ClientSession,
  ): Promise<StationEntity> {
    const updatedStation = await this.stationModel
      .findByIdAndUpdate(
        id,
        { $unset: { stationGroupId: 1 } },
        { new: true, session },
      )
      .lean();

    if (!updatedStation) {
      throw new NotFoundException(`Station ${id} not found`);
    }

    return updatedStation as StationEntity;
  }
}
