import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { MeasurementDto } from './measurement.dto';

export class BaseStationDto {
  @ApiProperty()
  createdDate: Date;

  @ApiProperty({
    type: LocationDto,
  })
  location: LocationDto;

  @ApiProperty({
    type: MeasurementDto,
    isArray: true,
  })
  measurements: MeasurementDto[];
}
