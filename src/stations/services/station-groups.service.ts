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
import { StationEntity } from '../database/model/station.entity';
import { StationMeasurementEntity } from '../database/model/station-measurement.entity';
import { StationMeasurementDto } from '../dto/station-measurement.dto';

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
      .lean();

    return stationsGroups.map((stationGroup: StationGroupEntity) =>
      this.mapStationGroupResponse(stationGroup),
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

    return this.mapStationGroupResponse(stationGroup);
  }

  async create(stationGroupDto: StationGroupDto): Promise<StationGroupEntity> {
    stationGroupDto.createdDate = new Date();
    stationGroupDto.stationsId = [];

    return await this.stationGroupModel.create(stationGroupDto);
  }

  async updateStationGroup(
    stationGroupId: string,
  ): Promise<StationGroupEntity> {
    const stations = await this.stationsService.findEntitiesByStationGroupId(
      stationGroupId,
    );

    return await this.addMeasurement(stationGroupId, stations);
  }

  async addMeasurement(
    stationGroupId: string,
    stations: StationEntity[],
  ): Promise<StationGroupEntity> {
    const groupMeasurement = this.buildGroupStationMeasurement(stations);

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

  async addStation(
    stationGroupId: string,
    stationId: string,
  ): Promise<StationGroupEntity> {
    await this.stationsService.addStationGroupId(stationId, stationGroupId);

    await this.stationGroupModel
      .findByIdAndUpdate(
        {
          _id: stationGroupId,
        },
        { $addToSet: { stations: stationId } },
        { new: true },
      )
      .lean();

    const updatedGroup = await this.updateStationGroup(stationGroupId);

    if (!updatedGroup) {
      throw new NotFoundException(`Station group ${stationGroupId} not found`);
    }

    return updatedGroup as StationGroupEntity;
  }

  async deleteStation(
    stationGroupId: string,
    stationId: string,
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
        { new: true },
      )
      .lean();

    const updatedGroup = await this.updateStationGroup(stationGroupId);

    if (!updatedGroup) {
      throw new NotFoundException(`Station group ${stationGroupId} not found`);
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
    measurement: StationMeasurementEntity,
  ): Partial<StationMeasurementDto> {
    if (measurement) {
      return {
        date: measurement.date,
        temperature: measurement.temperature,
        humidity: measurement.humidity,
        airPressure: measurement.airPressure,
      } as StationMeasurementDto;
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
