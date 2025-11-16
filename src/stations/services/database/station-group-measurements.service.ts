import { StationGroupMeasurementEntity } from '../../database/model/station-group-measurement.entity';
import { Injectable } from '@nestjs/common';
import { StationMeasurementDto } from '../../dto/station-measurement.dto';
import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class StationGroupMeasurementsService {
  constructor(
    @InjectModel(StationGroupMeasurementEntity.name)
    private stationMeasurementModel: Model<StationGroupMeasurementEntity>,
  ) {}

  async create(
    stationGroupId: string,
    stationMeasurementDto: StationMeasurementDto,
  ): Promise<StationGroupMeasurementEntity> {
    const measurement = {
      stationGroupId,
      date: new Date(),
      ...stationMeasurementDto,
    };

    return await this.stationMeasurementModel.create(measurement);
  }

  async deleteByStationId(stationId: string, session?: ClientSession) {
    return this.stationMeasurementModel.deleteMany({ stationId }, { session });
  }

  async findMeasurementsByDay(
    stationGroupId: string,
    date: Date,
  ): Promise<StationGroupMeasurementEntity[]> {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    return this.stationMeasurementModel
      .find({
        stationGroupId,
        date: { $gte: startDate, $lt: endDate },
      })
      .select('-_id -stationGroupId')
      .lean();
  }
}
