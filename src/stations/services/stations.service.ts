import { StationDto } from '../dto/station.dto';
import { MeasurementDto } from '../dto/measurement.dto';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
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

  async updateStationGroupId(
    id: string,
    stationGroupId: string,
  ): Promise<StationEntity> {
    return this.stationModel
      .findByIdAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: { stationGroupId } },
      )
      .exec();
  }

  async findAllNotGrouped(): Promise<StationResponseDto[]> {
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
  ): Promise<StationEntity | BadRequestException> {
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
        const stations: StationEntity[] = await this.stationModel
          .find({ stationGroupId: new Types.ObjectId(id) })
          .exec();

        const humidities: number[] = stations.map(
          (station) => station.measurements[0].humidity,
        );

        const humidityMean: number = this.calculateArithmeticMean(humidities);

        const temperatures: number[] = stations.map(
          (station) => station.measurements[0].temperature,
        );

        const temperatureMean: number =
          this.calculateArithmeticMean(temperatures);

        const airPressures: number[] = stations.map(
          (station) => station.measurements[0].airPressure,
        );

        const airPressureMean: number =
          this.calculateArithmeticMean(airPressures);

        const groupMeasurement = {
          date: new Date(),
          temperature: temperatureMean,
          humidity: humidityMean,
          airPressure: airPressureMean ?? 0,
        } as MeasurementDto;

        this.stationGroupsService.addMeasurement(
          station.stationGroupId,
          groupMeasurement,
        );
      }

      return await this.stationModel.findById(id).exec();
    }

    throw new BadRequestException('Temperature cannot be 0 o null');
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

  private calculateArithmeticMean(numbers: number[]): number {
    const itemsAmount = numbers.length;

    if (itemsAmount === 0) {
      return 0;
    }

    const sum = numbers.reduce((accumulator, value) => accumulator + value, 0);
    const arithmeticMean = sum / itemsAmount;

    return arithmeticMean;
  }
}
