import { ApiProperty } from '@nestjs/swagger';
import { BaseStationResponseDto } from './base-station.response.dto';
import { MeasurementDto } from './measurement.dto';

export class StationResponseDto extends BaseStationResponseDto {
  @ApiProperty({
    type: MeasurementDto,
    isArray: true,
    default: [],
  })
  measurements?: MeasurementDto[];

  @ApiProperty({
    type: String,
    default: '',
  })
  stationGroupId: string;
}
