import { Injectable } from '@nestjs/common';
import { MeasurementsCalculationService } from '../measurements-calculations.service';
import { StationEntity } from 'src/stations/database/model/station.entity';
import { MeasurementDto } from 'src/stations/dto/measurement.dto';
import { StationMeasurementEntity } from 'src/stations/database/model/station-measurement.entity';
import { StationMeasurementDto } from 'src/stations/dto/station-measurement.dto';

@Injectable()
export class MeasurementMapperService {
  constructor(private mCalculationService: MeasurementsCalculationService) {}

  buildGroupStationMeasurement(stations: StationEntity[]): MeasurementDto {
    const humidityMean: number =
      this.mCalculationService.calculateStationsHumidityeMean(stations);
    const temperatureMean: number =
      this.mCalculationService.calculateStationsTemperatureMean(stations);
    const airPressureMean: number =
      this.mCalculationService.calculateStationsAirPressureMean(stations);

    return {
      date: new Date(),
      temperature: temperatureMean,
      humidity: humidityMean,
      airPressure: airPressureMean ?? 0,
    } as MeasurementDto;
  }

  buildMeasurement(
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

  mapStationMeasurementDto(
    stationMeasurementEntity: StationMeasurementEntity,
  ): StationMeasurementDto {
    return {
      date: stationMeasurementEntity.date,
      temperature: stationMeasurementEntity.temperature,
      humidity: stationMeasurementEntity.humidity,
      airPressure: stationMeasurementEntity.airPressure,
    } as StationMeasurementDto;
  }
}
