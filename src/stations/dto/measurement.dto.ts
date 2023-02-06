import { ApiProperty } from '@nestjs/swagger';

export class MeasurementDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  temperature: number;

  @ApiProperty()
  humidity: number;

  @ApiProperty()
  airPressure: number;
}
