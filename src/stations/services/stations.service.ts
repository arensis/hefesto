import { StationDto } from '../dto/station.dto';
import { MeasurementDto } from '../dto/measurement.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StationEntity,
  StationDocument,
} from '../database/model/station.entity';
import { LocationDto } from '../dto/location.dto';
import { StationResponseDto } from '../dto/station-response.dto';
import { StationGroupsService } from './station-groups.service';

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(StationEntity.name)
    private stationModel: Model<StationDocument>,
    private readonly stationGroupsService: StationGroupsService,
  ) {}

  async findAll(): Promise<StationResponseDto[]> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const stations = await this.stationModel
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

    return stations.map((station: StationEntity) => {
      const measurement = station.measurements.slice(-1)[0];
      console.log('measurement', measurement);
      return {
        id: station?._id,
        createdDate: station.createdDate,
        location: {
          name: station.location.name,
          indoor: station.location.indoor,
          city: station.location.city,
          latitude: station.location.latitude,
          longitude: station.location.longitude,
        } as LocationDto,
        currentMeasurement: this.buildMeasurement(measurement),
      } as StationResponseDto;
    });
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

  async findMeasurementsBy(
    stationId: string,
    measurementDate: Date,
  ): Promise<MeasurementDto[]> {
    const date = new Date(measurementDate);
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const station = await this.stationModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(stationId) } },
        {
          $project: {
            _id: 0,
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

    return station[0]?.measurements;
  }

  async findById(id: string): Promise<StationResponseDto> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const stationEntities: StationEntity[] = await this.stationModel
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
          },
        },
      ])
      .exec();

    const station = stationEntities[0];
    const measurement = station.measurements.slice(-1)[0];
    console.log('station', station);

    return {
      id: station?._id,
      createdDate: station.createdDate,
      location: {
        name: station.location.name,
        indoor: station.location.indoor,
        city: station.location.city,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
      } as LocationDto,
      currentMeasurement: this.buildMeasurement(measurement),
    } as StationResponseDto;
  }

  async create(stationDto: StationDto): Promise<StationEntity> {
    stationDto.createdDate = new Date();
    stationDto.measurements = [];

    return await this.stationModel.create(stationDto);
  }

  async addMeasurement(
    id: string,
    measurementDto: Partial<MeasurementDto>,
  ): Promise<StationEntity> {
    console.log('measurementDto', measurementDto);

    if ((measurementDto?.temperature || 0) > 0) {
      const measurement = {
        date: new Date(),
        temperature: measurementDto.temperature,
        humidity: measurementDto.humidity,
        airPressure: measurementDto.airPressure ?? 0,
      } as MeasurementDto;

      const station: StationEntity = await this.stationModel.findById(id);

      this.stationModel
        .updateOne(
          { _id: new Types.ObjectId(id) },
          { $push: { measurements: measurement } },
        )
        .exec();

      if (station.stationGroupId) {
        this.stationGroupsService.addMeasurement(
          station.stationGroupId,
          measurement,
        );
      }

      return station;
    }

    return await this.stationModel.findById(id).exec();
  }

  async delete(id: string) {
    return await this.stationModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
  }

  private getCurrentISOString(date: Date): string {
    return date.toISOString();
  }
}
