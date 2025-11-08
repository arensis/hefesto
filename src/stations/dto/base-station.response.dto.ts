import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { MeasurementDto } from './measurement.dto';

export class BaseStationResponseDto {
  @ApiProperty()
  createdDate: Date;

  @ApiProperty({
    type: LocationDto,
  })
  location: LocationDto;

  @ApiProperty({
    type: MeasurementDto,
  })
  currentMeasurement: MeasurementDto;
}
