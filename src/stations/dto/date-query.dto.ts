import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class DateQueryDto {
  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiPropertyOptional({
    description:
      'Agrupacion del downsampling en minutos (1 punto por bucket). ' +
      'Si no se indica, se devuelven todas las medidas del dia (sin agrupar). ' +
      'Ej.: 10 para desktop, 20 para movil.',
    example: 10,
  })
  @IsOptional()
  bucketMinutes?: string;
}

export function toDate(value: string): Date {
  console.log(value);
  return new Date(value);
}

// Convierte el bucketMinutes recibido por query (string) en un entero seguro.
// Ante valor ausente, no numerico o <= 0 devuelve el fallback (0 => sin agrupar,
// se devuelve todo). Acota a 1 dia como maximo.
export function parseBucketMinutes(value?: string, fallback = 0): number {
  const n = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 1440);
}
