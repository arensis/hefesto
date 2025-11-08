import { ApiProperty } from '@nestjs/swagger';
import { BaseStationDto } from './base-station.dto';

export class StationGroupDto extends BaseStationDto {
  @ApiProperty({
    type: String,
    isArray: true,
  })
  stationsId: string[];
}
