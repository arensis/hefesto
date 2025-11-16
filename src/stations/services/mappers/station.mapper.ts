import { Injectable } from '@nestjs/common';
import { StationEntity } from 'src/stations/database/model/station.entity';
import { LocationDto } from 'src/stations/dto/location.dto';
import { StationResponseDto } from 'src/stations/dto/station-response.dto';
import { MeasurementMapperService } from './measurement.mapper';

@Injectable()
export class StationMapperService {
  constructor(private measurementMapper: MeasurementMapperService) {}

  mapStationResponseDto(station: StationEntity): StationResponseDto {
    return {
      id: station?._id,
      createdDate: station.createdDate,
      location: {
        name: station.location.name,
        indoor: station.location.indoor,
        city: station.location.city,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
      } as LocationDto,
      currentMeasurement: this.measurementMapper.buildMeasurement(
        station.currentMeasurement,
      ),
      stationGroupId: station.stationGroupId,
    } as StationResponseDto;
  }
}
