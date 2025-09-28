import { StationGroupResponseDto } from './../dto/station-group-response.dto';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  StationGroupDocument,
  StationGroupEntity,
} from '../database/station-group.entity';
import { Model, Types } from 'mongoose';
import { LocationDto } from '../dto/location.dto';
import { MeasurementDto } from '../dto/measurement.dto';
import { StationGroupDto } from '../dto/station.group.dto';
import { StationsService } from './stations.service';
import { MeasurementEntity } from '../database/model/measurement.entity';
import { StationEntity } from '../database/model/station.entity';

@Injectable()
export class StationGroupsService {
  constructor(
    @InjectModel(StationGroupEntity.name)
    private stationGroupModel: Model<StationGroupDocument>,
    @Inject(forwardRef(() => StationsService))
    private stationsService: StationsService,
  ) {}

  async findAll(): Promise<StationGroupResponseDto[]> {
    const stationsGroups = await this.stationGroupModel
      .find({
        $or: [
          { stationGroupId: { $exists: false } },
          { stationGroupId: { $in: [null, ''] } },
        ],
      })
      .select('-measurements') // 👈 excluir explícitamente
      .lean()
      .exec();

    return stationsGroups.map((stationGroup: StationGroupEntity) => {
      return {
        id: stationGroup?._id,
        createdDate: stationGroup.createdDate,
        currentMeasurement: this.buildMeasurement(
          stationGroup.currentMeasurement,
        ),
        location: {
          name: stationGroup.location.name,
          indoor: stationGroup.location.indoor,
          city: stationGroup.location.city,
          latitude: stationGroup.location.latitude,
          longitude: stationGroup.location.longitude,
        } as LocationDto,
        stations: stationGroup.stations,
      } as StationGroupResponseDto;
    });
  }

  async findById(id: string): Promise<StationGroupResponseDto> {
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
              stations: 1,
            },
          },
        ])
        .exec();

    const stationGroup = stationGroupEntities[0];

    return {
      id: stationGroup?._id,
      createdDate: stationGroup.createdDate,
      currentMeasurement: this.buildMeasurement(
        stationGroup.currentMeasurement,
      ),
      location: {
        name: stationGroup.location.name,
        indoor: stationGroup.location.indoor,
        city: stationGroup.location.city,
        latitude: stationGroup.location.latitude,
        longitude: stationGroup.location.longitude,
      } as LocationDto,
      stations: stationGroup.stations,
    } as StationGroupResponseDto;
  }

  async create(stationGroupDto: StationGroupDto): Promise<StationGroupEntity> {
    stationGroupDto.createdDate = new Date();
    stationGroupDto.measurements = [];
    stationGroupDto.stationsId = [];

    return await this.stationGroupModel.create(stationGroupDto);
  }

  async addMeasurement(
    id: string,
    stations: StationEntity[],
  ): Promise<StationGroupEntity> {
    const groupMeasurement = this.buildGroupStationMeasurement(stations);

    if ((groupMeasurement?.temperature || 0) <= 0) {
      throw new BadRequestException('Temperature cannot be 0 o null');
    }

    const stationGroup = await this.stationGroupModel.findById(id);
    if (!stationGroup) throw new NotFoundException('Station group not found');

    stationGroup.currentMeasurement = groupMeasurement;
    stationGroup.measurements.push(groupMeasurement);

    return stationGroup.save();
  }

  buildGroupStationMeasurement(stations: StationEntity[]): MeasurementDto {
    const humidityMean: number = this.calculateStationsHumidityeMean(stations);
    const temperatureMean: number =
      this.calculateStationsTemperatureMean(stations);
    const airPressureMean: number =
      this.calculateStationsAirPressureMean(stations);

    return {
      date: new Date(),
      temperature: temperatureMean,
      humidity: humidityMean,
      airPressure: airPressureMean ?? 0,
    } as MeasurementDto;
  }

  async addStation(id: string, stationId: string): Promise<StationGroupEntity> {
    await this.stationsService.updateStationGroupId(stationId, id);

    return await this.stationGroupModel.findByIdAndUpdate(
      { _id: new Types.ObjectId(id) },
      { $push: { stations: stationId } },
    );
  }

  async delete(id: string) {
    return await this.stationGroupModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
  }

  private buildMeasurement(
    measurement: MeasurementEntity,
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

  private calculateStationsTemperatureMean(stations: StationEntity[]): number {
    const temperatures: number[] = stations
      .map((station) => station.measurements[0].temperature)
      .filter(
        (value: number) => value !== null && value !== undefined && value > 0,
      );

    return this.calculateArithmeticMean(temperatures);
  }

  private calculateStationsHumidityeMean(stations: StationEntity[]): number {
    const humidityMeasurements: number[] = stations.map(
      (station) => station.measurements[0].humidity,
    );

    return this.calculateArithmeticMean(humidityMeasurements);
  }

  private calculateStationsAirPressureMean(stations: StationEntity[]): number {
    const airPressureMeasurements: number[] = stations.map(
      (station) => station.measurements[0].airPressure,
    );

    return this.calculateArithmeticMean(airPressureMeasurements);
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
