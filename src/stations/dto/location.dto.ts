import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  indoor: boolean;

  @ApiProperty()
  city: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;
}
