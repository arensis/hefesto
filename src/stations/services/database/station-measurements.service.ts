import { StationMeasurementEntity } from '../../database/model/station-measurement.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { StationMeasurementDto } from '../../dto/station-measurement.dto';

@Injectable()
export class StationMeasurementsService {
  constructor(
    @InjectModel(StationMeasurementEntity.name)
    private stationMeasurementModel: Model<StationMeasurementEntity>,
  ) {}

  async create(
    stationId: string,
    stationMeasurementDto: StationMeasurementDto,
    session?: ClientSession,
  ): Promise<StationMeasurementEntity> {
    const measurement = new this.stationMeasurementModel({
      stationId,
      date: new Date(),
      ...stationMeasurementDto,
    });

    return await measurement.save({ session });
  }

  async deleteByStationId(stationId: string, session?: ClientSession) {
    return this.stationMeasurementModel.deleteMany({ stationId }, { session });
  }

  async findMeasurementsByDay(
    stationId: string,
    date: Date,
  ): Promise<StationMeasurementEntity[]> {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    return this.stationMeasurementModel
      .find({
        stationId,
        date: { $gte: startDate, $lt: endDate },
      })
      .select('-_id -stationId')
      .lean();
  }
}
