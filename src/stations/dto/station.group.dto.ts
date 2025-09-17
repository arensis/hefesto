import { ApiProperty } from '@nestjs/swagger';
import { StationDto } from './station.dto';

export class StationGroupDto extends StationDto {
  @ApiProperty({
    type: String,
    isArray: true,
  })
  stationsId: string[];
}
