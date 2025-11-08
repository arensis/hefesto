import { ApiProperty } from '@nestjs/swagger';
import { BaseStationResponseDto } from './base-station.response.dto';
import { StationMeasurementDto } from './station-measurement.dto';

export class StationResponseDto extends BaseStationResponseDto {
  @ApiProperty({
    type: StationMeasurementDto,
    isArray: true,
    default: [],
  })
  measurements?: StationMeasurementDto[];

  @ApiProperty({
    type: String,
    default: '',
  })
  stationGroupId: string;
}
