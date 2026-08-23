import { StationGroupMeasurementEntity } from '../../database/model/station-group-measurement.entity';
import { Injectable } from '@nestjs/common';
import { StationMeasurementDto } from '../../dto/station-measurement.dto';
import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { downsampleByBucket } from './downsample.util';

@Injectable()
export class StationGroupMeasurementsService {
  constructor(
    @InjectModel(StationGroupMeasurementEntity.name)
    private stationMeasurementModel: Model<StationGroupMeasurementEntity>,
  ) {}

  async create(
    stationGroupId: string,
    stationMeasurementDto: StationMeasurementDto,
    session?: ClientSession,
  ): Promise<StationGroupMeasurementEntity> {
    const measurement = new this.stationMeasurementModel({
      stationGroupId,
      date: new Date(),
      ...stationMeasurementDto,
    });

    return await measurement.save({ session });
  }

  async deleteByStationId(stationId: string, session?: ClientSession) {
    return this.stationMeasurementModel.deleteMany({ stationId }, { session });
  }

  async findMeasurementsByDay(
    stationGroupId: string,
    date: Date,
    bucketMinutes = 0, // 0 => sin downsampling: devuelve todas las medias del dia
  ): Promise<StationGroupMeasurementEntity[]> {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const measurements = await this.stationMeasurementModel
      .find({
        stationGroupId,
        date: { $gte: startDate, $lt: endDate },
      })
      .select('-_id -stationGroupId')
      .sort({ date: 1 })
      .lean();

    return downsampleByBucket(measurements, bucketMinutes);
  }
}
