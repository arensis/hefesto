import { Injectable } from '@nestjs/common';
import { StationGroupEntity } from 'src/stations/database/model/station-group.entity';
import { StationGroupResponseDto } from 'src/stations/dto/station-group-response.dto';
import { MeasurementMapperService } from './measurement.mapper';
import { LocationDto } from 'src/stations/dto/location.dto';

@Injectable()
export class StationGroupResponseMapper {
  constructor(private measurementMapper: MeasurementMapperService) {}

  mapStationGroupResponse(
    stationGroup: StationGroupEntity,
  ): StationGroupResponseDto {
    return {
      id: stationGroup?._id,
      createdDate: stationGroup.createdDate,
      currentMeasurement: this.measurementMapper.buildMeasurement(
        stationGroup.currentMeasurement,
      ),
      location: {
        name: stationGroup.location.name,
        indoor: stationGroup.location.indoor,
        city: stationGroup.location.city,
        latitude: stationGroup.location.latitude,
        longitude: stationGroup.location.longitude,
      } as LocationDto,
      stations: stationGroup.stations,
    } as StationGroupResponseDto;
  }
}
