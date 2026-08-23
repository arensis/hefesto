import { Injectable } from '@nestjs/common';
import { StationEntity } from '../database/model/station.entity';
import { StationMeasurementEntity } from '../database/model/station-measurement.entity';

@Injectable()
export class MeasurementsCalculationService {
  // Una estacion se considera OPERATIVA si su ultima medicion es reciente.
  // Las estaciones caidas NO participan en la media del grupo.
  // A 5 min de intervalo de medida, 20 min = 4 ciclos fallidos = caida.
  private static readonly OPERATIONAL_THRESHOLD_MIN = 20;

  // Devuelve solo las estaciones con medicion reciente (operativas).
  getOperationalStations(stations: StationEntity[]): StationEntity[] {
    return (stations ?? []).filter((station) => this.isOperational(station));
  }

  // Una estacion es operativa si su ultima medicion cae dentro del umbral.
  isOperational(station: StationEntity): boolean {
    const date = station?.currentMeasurement?.date;
    if (!date) return false;

    const thresholdMs =
      MeasurementsCalculationService.OPERATIONAL_THRESHOLD_MIN * 60 * 1000;
    return Date.now() - new Date(date).getTime() <= thresholdMs;
  }

  calculateStationsTemperatureMean(stations: StationEntity[]): number {
    return this.meanOf(stations, (m) => m.temperature);
  }

  calculateStationsHumidityMean(stations: StationEntity[]): number {
    return this.meanOf(stations, (m) => m.humidity);
  }

  calculateStationsAirPressureMean(stations: StationEntity[]): number {
    return this.meanOf(stations, (m) => m.airPressure);
  }

  // Media aritmetica de un campo sobre las estaciones dadas, tomando solo los
  // valores numericos validos. NO excluye 0 ni negativos (0 grados o bajo cero
  // son lecturas validas); solo descarta null/undefined/NaN.
  private meanOf(
    stations: StationEntity[],
    pick: (measurement: StationMeasurementEntity) => number,
  ): number {
    const values = (stations ?? [])
      .map((station) => pick(station.currentMeasurement))
      .filter((value): value is number => Number.isFinite(value));

    return this.calculateArithmeticMean(values);
  }

  private calculateArithmeticMean(numbers: number[]): number {
    if (numbers.length === 0) {
      return 0;
    }

    const sum = numbers.reduce((accumulator, value) => accumulator + value, 0);
    return sum / numbers.length;
  }
}
