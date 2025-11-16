import { ApiProperty } from '@nestjs/swagger';

export class StationMeasurementDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  temperature: number;

  @ApiProperty()
  humidity: number;

  @ApiProperty()
  airPressure: number;
}
