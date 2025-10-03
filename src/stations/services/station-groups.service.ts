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
          { stationGroupId: { $in: [null, '', undefined] } },
        ],
      })
      .select('-measurements')
      .lean();

    return stationsGroups.map((stationGroup: StationGroupEntity) =>
      this.mapStationGroupResponse(stationGroup),
    );
  }

  async findById(id: string): Promise<StationGroupResponseDto> {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(date);
    date.setDate(date.getDate() + 1);
    const endDate = new Date(date);

    const stationGroup = await this.stationGroupModel
      .findOne(
        { _id: new Types.ObjectId(id) },
        {
          location: 1,
          createdDate: 1,
          currentMeasurement: 1,
          stations: 1,
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

    return this.mapStationGroupResponse(stationGroup);
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
      throw new BadRequestException('Temperature cannot be 0 or null');
    }

    const updated = await this.stationGroupModel
      .findByIdAndUpdate(
        id,
        {
          $set: { currentMeasurement: groupMeasurement },
          $push: { measurements: groupMeasurement },
        },
        { new: true, lean: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Station group not found');
    }

    return updated as StationGroupEntity;
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
    await this.stationsService.addStationGroupId(stationId, id);

    const updatedGroup = await this.stationGroupModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { stations: stationId } },
        { new: true },
      )
      .lean();

    if (!updatedGroup) {
      throw new NotFoundException(`Station group ${id} not found`);
    }

    return updatedGroup as StationGroupEntity;
  }

  async deleteStation(
    id: string,
    stationId: string,
  ): Promise<StationGroupEntity> {
    const station = await this.stationsService.deleteStationGroupId(stationId);

    if (!station) {
      throw new NotFoundException(`Station ${stationId} not found`);
    }

    const updatedGroup = await this.stationGroupModel
      .findByIdAndUpdate(id, { $pull: { stations: stationId } }, { new: true })
      .lean();

    if (!updatedGroup) {
      throw new NotFoundException(`Station group ${id} not found`);
    }

    return updatedGroup as StationGroupEntity;
  }

  async delete(id: string) {
    const result = await this.stationGroupModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Station ${id} not found`);
    }

    return result;
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
      .map((station) => station.currentMeasurement.temperature)
      .filter(
        (value: number) => value !== null && value !== undefined && value > 0,
      );

    return this.calculateArithmeticMean(temperatures);
  }

  private calculateStationsHumidityeMean(stations: StationEntity[]): number {
    const humidityMeasurements: number[] = stations.map(
      (station) => station.currentMeasurement.humidity,
    );

    return this.calculateArithmeticMean(humidityMeasurements);
  }

  private calculateStationsAirPressureMean(stations: StationEntity[]): number {
    const airPressureMeasurements: number[] = stations.map(
      (station) => station.currentMeasurement.airPressure,
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

  private mapStationGroupResponse(
    stationGroup: StationGroupEntity,
  ): StationGroupResponseDto {
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
}
