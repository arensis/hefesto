import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class DateQueryDto {
  @ApiProperty()
  @Transform(({ value }) => toDate(value))
  @IsDate()
  @IsNotEmpty()
  date: Date;
}

export function toDate(value: string): Date {
  console.log(value);
  return new Date(value);
}
