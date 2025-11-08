import { StationMeasurementEntity } from './../database/model/station-measurement.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StationMeasurementDto } from '../dto/station-measurement.dto';

@Injectable()
export class StationMeasurementsService {
  constructor(
    @InjectModel(StationMeasurementEntity.name)
    private stationMeasurementModel: Model<StationMeasurementEntity>,
  ) {}

  //TODO: Crear servicio y entidad con colección propia para guardar las mediciones de los grupos de staciones

  async create(
    stationId: string,
    stationMeasurementDto: StationMeasurementDto,
  ): Promise<StationMeasurementEntity> {
    const measurement = {
      stationId,
      date: new Date(),
      ...stationMeasurementDto,
    };

    return await this.stationMeasurementModel.create(measurement);
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
