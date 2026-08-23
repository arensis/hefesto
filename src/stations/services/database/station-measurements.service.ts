import { StationMeasurementEntity } from '../../database/model/station-measurement.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { StationMeasurementDto } from '../../dto/station-measurement.dto';
import { downsampleByBucket } from './downsample.util';

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
    bucketMinutes = 0, // 0 => sin downsampling: devuelve todas las medidas del dia
  ): Promise<StationMeasurementEntity[]> {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const measurements = await this.stationMeasurementModel
      .find({
        stationId,
        date: { $gte: startDate, $lt: endDate },
      })
      .select('-_id -stationId')
      .sort({ date: 1 })
      .lean();

    return downsampleByBucket(measurements, bucketMinutes);
  }
}
