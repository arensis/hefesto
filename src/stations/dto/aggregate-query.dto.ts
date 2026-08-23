import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export type AggregatePeriod = 'day' | 'month' | 'year';

export class AggregateQueryDto {
  @ApiProperty({ description: 'Fecha de referencia (YYYY-MM-DD) dentro del periodo' })
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    description: 'Periodo de agregacion. Por defecto "day".',
    enum: ['day', 'month', 'year'],
    example: 'month',
  })
  @IsOptional()
  period?: string;
}

// Normaliza el periodo recibido por query; por defecto 'day'.
export function parsePeriod(value?: string): AggregatePeriod {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'month' || normalized === 'year') {
    return normalized;
  }
  return 'day';
}
