import { Injectable } from '@nestjs/common';
import { StationEntity } from '../database/model/station.entity';

@Injectable()
export class MeasurementsCalculationService {
  calculateStationsTemperatureMean(stations: StationEntity[]): number {
    const temperatures: number[] = stations
      .map((station) => station.currentMeasurement.temperature)
      .filter(
        (value: number) => value !== null && value !== undefined && value > 0,
      );

    return this.calculateArithmeticMean(temperatures);
  }

  calculateStationsHumidityeMean(stations: StationEntity[]): number {
    const humidityMeasurements: number[] = stations.map(
      (station) => station.currentMeasurement.humidity,
    );

    return this.calculateArithmeticMean(humidityMeasurements);
  }

  calculateStationsAirPressureMean(stations: StationEntity[]): number {
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
}
