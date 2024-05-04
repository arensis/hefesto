import { MeasurementDto } from './measurement.dto';
import { LocationDto } from './location.dto';
import { ApiProperty } from '@nestjs/swagger';

export class StationResponseDto {
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
