import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  StationGroupDocument,
  StationGroupEntity,
} from '../database/station-group.entity';
import { Model, Types } from 'mongoose';
import { LocationDto } from '../dto/location.dto';
import { MeasurementDto } from '../dto/measurement.dto';
import { StationGroupResponseDto } from '../dto/station-group-response.dto';
import { StationResponseDto } from '../dto/station-response.dto';
import { StationGroupDto } from '../dto/station.group.dto';

@Injectable()
export class StationGroupsService {
  constructor(
    @InjectModel(StationGroupEntity.name)
    private stationGroupModel: Model<StationGroupDocument>,
  ) {}

  async findAll(): Promise<StationResponseDto[]> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const stationGroups = await this.stationGroupModel
      .aggregate([
        {
          $project: {
            location: 1,
            createdDate: 1,
            measurements: {
              $filter: {
                input: '$measurements',
                cond: {
                  $and: [
                    { $gte: ['$$this.date', startDate] },
                    { $lt: ['$$this.date', endDate] },
                  ],
                },
              },
            },
          },
        },
      ])
      .exec();

    return stationGroups.map((stationGroup: StationGroupEntity) => {
      const measurement = stationGroup.measurements.slice(-1)[0];

      return {
        id: stationGroup?._id,
        createdDate: stationGroup.createdDate,
        location: {
          name: stationGroup.location.name,
          indoor: stationGroup.location.indoor,
          city: stationGroup.location.city,
          latitude: stationGroup.location.latitude,
          longitude: stationGroup.location.longitude,
        } as LocationDto,
        currentMeasurement: this.buildMeasurement(measurement),
      } as StationGroupResponseDto;
    });
  }

  async findById(id: string): Promise<StationResponseDto> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const stationGroupEntities: StationGroupEntity[] =
      await this.stationGroupModel
        .aggregate([
          { $match: { _id: new Types.ObjectId(id) } },
          {
            $project: {
              location: 1,
              createdDate: 1,
              measurements: {
                $filter: {
                  input: '$measurements',
                  cond: {
                    $and: [
                      { $gte: ['$$this.date', startDate] },
                      { $lt: ['$$this.date', endDate] },
                    ],
                  },
                },
              },
              stationsId: 1,
            },
          },
        ])
        .exec();

    const stationGroup = stationGroupEntities[0];
    const measurement = stationGroup.measurements.slice(-1)[0];

    return {
      id: stationGroup?._id,
      createdDate: stationGroup.createdDate,
      location: {
        name: stationGroup.location.name,
        indoor: stationGroup.location.indoor,
        city: stationGroup.location.city,
        latitude: stationGroup.location.latitude,
        longitude: stationGroup.location.longitude,
      } as LocationDto,
      currentMeasurement: this.buildMeasurement(measurement),
    } as StationGroupResponseDto;
  }

  async create(stationGroupDto: StationGroupDto): Promise<StationGroupEntity> {
    stationGroupDto.createdDate = new Date();
    stationGroupDto.measurements = [];
    stationGroupDto.stationsId = [];

    return await this.stationGroupModel.create(StationGroupDto);
  }

  async addMeasurement(
    id: string,
    measurementDto: Partial<MeasurementDto>,
  ): Promise<StationGroupEntity> {
    if ((measurementDto?.temperature || 0) > 0) {
      const measurement = {
        date: new Date(),
        temperature: measurementDto.temperature,
        humidity: measurementDto.humidity,
        airPressure: measurementDto.airPressure ?? 0,
      } as MeasurementDto;

      const station: StationGroupEntity = await this.stationGroupModel
        .findByIdAndUpdate(
          { _id: new Types.ObjectId(id) },
          { $push: { measurements: measurement } },
        )
        .exec();

      return station;
    }

    return await this.stationGroupModel.findById(id).exec();
  }

  async addStation(id: string, stationId: string): Promise<StationGroupEntity> {
    return await this.stationGroupModel.findByIdAndUpdate(
      { _id: new Types.ObjectId(id) },
      { $push: { stationIds: stationId } },
    );
  }

  async delete(id: string) {
    return await this.stationGroupModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
  }

  private buildMeasurement(
    measurement: MeasurementDto,
  ): Partial<MeasurementDto> {
    if (measurement) {
      return {
        date: measurement.date,
        temperature: measurement.temperature,
        humidity: measurement.humidity,
        airPressure: measurement.airPressure,
      } as MeasurementDto;
    }

    return {};
  }
}
