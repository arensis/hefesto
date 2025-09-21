import { ApiProperty } from '@nestjs/swagger';
import { BaseStationResponseDto } from './base-station.response.dto';

export class StationGroupResponseDto extends BaseStationResponseDto {
  @ApiProperty({
    type: String,
    isArray: true,
  })
  stations: string[];
}
