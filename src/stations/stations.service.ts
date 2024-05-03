import { StationDto } from './dto/station.dto';
import { MeasurementDto } from './dto/measurement.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StationEntity,
  StationDocument,
} from './database/model/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(StationEntity.name)
    private stationModel: Model<StationDocument>,
  ) {}

  async findAll(): Promise<StationEntity[]> {
    return await this.stationModel.find().exec();
  }

  async findOneByIdAndDate(
    id: string,
    measurementDate: Date,
  ): Promise<StationEntity> {
    const startDate = this.getCurrentISOString(measurementDate);
    measurementDate.setDate(measurementDate.getDate() + 1);
    const endDate = this.getCurrentISOString(measurementDate);

    const stations = await this.stationModel
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

    return stations[0];
  }

  async create(stationDto: StationDto): Promise<StationEntity> {
    stationDto.createdDate = new Date();
    stationDto.measurements = [];

    return await this.stationModel.create(stationDto);
  }

  async addMeasurement(
    id: string,
    measurementDto: MeasurementDto,
  ): Promise<StationEntity> {
    const station: StationEntity = await this.stationModel
      .findByIdAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $push: { measurements: measurementDto } },
        function (error, success) {
          if (error) {
            console.error(error);
          } else {
            console.log(success);
          }
        },
      )
      .clone();

    return station;
  }

  async delete(id: string) {
    return await this.stationModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
  }

  private getCurrentISOString(date: Date): string {
    return date.toISOString().slice(0, date.toISOString().indexOf('T'));
  }
}
