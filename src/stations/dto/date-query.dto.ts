import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty } from 'class-validator';

export class DateQueryDto {
  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  date: Date;
}

export function toDate(value: string): Date {
  console.log(value);
  return new Date(value);
}
