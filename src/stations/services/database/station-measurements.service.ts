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

    return this.downsample(measurements, bucketMinutes);
  }

  // Conserva una medida por cada bucket de N minutos (la primera de cada bucket).
  // Los datos historicos densos (p. ej. una medida cada pocos segundos) se
  // devuelven ya aligerados, manteniendo intactos los documentos en la BD.
  private downsample(
    measurements: StationMeasurementEntity[],
    bucketMinutes: number,
  ): StationMeasurementEntity[] {
    if (!bucketMinutes || bucketMinutes <= 0) return measurements;

    const bucketMs = bucketMinutes * 60 * 1000;
    const result: StationMeasurementEntity[] = [];
    let lastBucket: number | null = null;

    for (const m of measurements) {
      const bucket = Math.floor(new Date(m.date).getTime() / bucketMs);
      if (bucket !== lastBucket) {
        result.push(m);
        lastBucket = bucket;
      }
    }

    return result;
  }
}
