import { Injectable } from '@nestjs/common';
import { MeasurementsCalculationService } from '../measurements-calculations.service';
import { StationEntity } from 'src/stations/database/model/station.entity';
import { MeasurementDto } from 'src/stations/dto/measurement.dto';
import { StationMeasurementEntity } from 'src/stations/database/model/station-measurement.entity';
import { StationMeasurementDto } from 'src/stations/dto/station-measurement.dto';

@Injectable()
export class MeasurementMapperService {
  constructor(private mCalculationService: MeasurementsCalculationService) {}

  buildGroupStationMeasurement(stations: StationEntity[]): MeasurementDto | null {
    // Solo las estaciones operativas (medicion reciente) participan en la media.
    const operational =
      this.mCalculationService.getOperationalStations(stations);

    // Sin estaciones operativas no hay media valida: no inventamos un 0.
    if (operational.length === 0) {
      return null;
    }

    return {
      date: new Date(),
      temperature:
        this.mCalculationService.calculateStationsTemperatureMean(operational),
      humidity:
        this.mCalculationService.calculateStationsHumidityMean(operational),
      airPressure:
        this.mCalculationService.calculateStationsAirPressureMean(operational) ??
        0,
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
