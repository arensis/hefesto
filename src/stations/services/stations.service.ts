import { StationDto } from '../dto/station.dto';
import { MeasurementDto } from '../dto/measurement.dto';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    @Inject(forwardRef(() => StationGroupsService))
    private readonly stationGroupsService: StationGroupsService,
  ) {}

  async findByIdWithCurrentDayMeasurements(
    id: string,
  ): Promise<StationResponseDto> {
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
            stationGroupId: 1,
            currentMeasurement: 1,
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

    if (!station) throw new NotFoundException('Not found station ' + id);

    return {
      id: station?._id,
      createdDate: station.createdDate,
      location: {
        name: station.location.name,
        indoor: station.location.indoor,
        city: station.location.city,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        measurements: station.measurements,
      } as LocationDto,
      currentMeasurement: this.buildMeasurement(station.currentMeasurement),
      stationGroupId: station.stationGroupId,
    } as StationResponseDto;
  }

  async addStationGroupId(
    id: string,
    stationGroupId: string,
  ): Promise<StationEntity> {
    return await this.stationModel
      .findByIdAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: { stationGroupId } },
      )
      .exec();
  }

  async deleteStationGroupId(id: string): Promise<StationEntity> {
    await this.stationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $unset: { stationGroupId: 1 } },
      )
      .exec();

    return this.stationModel.findById(id);
  }

  async findAllNotGrouped(): Promise<StationResponseDto[]> {
    const stations = await this.stationModel
      .find({
        $or: [
          { stationGroupId: { $exists: false } },
          { stationGroupId: { $in: [null, ''] } },
        ],
      })
      .select('-measurements')
      .lean()
      .exec();

    return stations.map((station: StationEntity) => {
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
        currentMeasurement: this.buildMeasurement(station.currentMeasurement),
        stationGroupId: station.stationGroupId,
      } as StationResponseDto;
    });
  }

  async findAll(): Promise<StationResponseDto[]> {
    const stations = await this.stationModel
      .aggregate([
        {
          $match: {
            $or: [
              { stationGroupId: { $exists: false } },
              { stationGroupId: { $in: [null, ''] } },
            ],
          },
        },
        {
          $project: {
            location: 1,
            createdDate: 1,
            stationGroupId: 1,
            currentMeasurement: 1,
          },
        },
      ])
      .exec();

    return stations.map((station: StationEntity) => {
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
        currentMeasurement: this.buildMeasurement(station.currentMeasurement),
        stationGroupId: station.stationGroupId,
      } as StationResponseDto;
    });
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

  async findByStationGroupId(
    stationGroupId: string,
  ): Promise<StationResponseDto[]> {
    const stations: StationEntity[] = await this.stationModel
      .aggregate([
        { $match: { stationGroupId: stationGroupId } },
        {
          $project: {
            location: 1,
            createdDate: 1,
            stationGroupId: 1,
            currentMeasurement: 1,
          },
        },
      ])
      .exec();

    return stations.map((station: StationEntity) => {
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
        currentMeasurement: this.buildMeasurement(station.currentMeasurement),
        stationGroupId: station.stationGroupId,
      } as StationResponseDto;
    });
  }

  async findById(id: string): Promise<StationResponseDto> {
    const station = await this.stationModel
      .findById(id)
      .select('-measurements')
      .lean()
      .exec();

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
      currentMeasurement: this.buildMeasurement(station.currentMeasurement),
      measurements: station.measurements,
      stationGroupId: station.stationGroupId,
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
  ): Promise<StationResponseDto> {
    console.log('Checking is is valid measurement');
    if ((measurementDto?.temperature || 0) <= 0) {
      throw new BadRequestException('Temperature cannot be 0 o null');
    }

    const measurement = {
      date: new Date(),
      temperature: measurementDto.temperature,
      humidity: measurementDto.humidity,
      airPressure: measurementDto.airPressure ?? 0,
    };

    await this.stationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $set: { currentMeasurement: measurement },
        $push: { measurements: measurement },
      },
    );

    const station = await this.findById(id);

    return station;
  }

  async updateStationGroup(stationGroupId: string): Promise<void> {
    const stations: StationEntity[] = await this.stationModel
      .find({ stationGroupId: new Types.ObjectId(stationGroupId) })
      .exec();

    await this.stationGroupsService.addMeasurement(stationGroupId, stations);
  }

  async delete(id: string) {
    return await this.stationModel
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
