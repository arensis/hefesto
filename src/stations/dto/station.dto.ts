import { MeasurementDto } from './measurement.dto';
import { LocationDto } from './location.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class StationDto {
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
