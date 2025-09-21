import { ApiProperty } from '@nestjs/swagger';
import { BaseStationDto } from './base-station.dto';

export class StationDto extends BaseStationDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  stationGroupId?: string;
}
