import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailyRollupDocument = HydratedDocument<DailyRollupEntity>;

export type RollupOwnerType = 'station' | 'group';

// Un extremo (minimo o maximo) con su fecha/hora.
export interface Extreme {
  value: number;
  date: Date;
}

// Acumulador de una metrica dentro de un dia.
export interface MetricRollup {
  sum: number;
  count: number;
  min?: Extreme;
  max?: Extreme;
}

// Rollup diario de una estacion o de un grupo. Se actualiza de forma
// incremental en cada medicion (sum/count para la media, min/max con su fecha)
// y permite calcular agregados diarios/mensuales/anuales sin re-escanear datos.
@Schema({ collection: 'daily_rollups', timestamps: true })
export class DailyRollupEntity {
  @Prop({ type: String, required: true })
  ownerType: RollupOwnerType;

  @Prop({ type: String, required: true })
  ownerId: string;

  @Prop({ type: Date, required: true })
  day: Date; // medianoche UTC del dia

  @Prop({ type: Object })
  temperature: MetricRollup;

  @Prop({ type: Object })
  humidity: MetricRollup;

  @Prop({ type: Object })
  airPressure: MetricRollup;

  _id: any;
}

export const DailyRollupEntitySchema =
  SchemaFactory.createForClass(DailyRollupEntity);

// Un rollup por propietario y dia; ademas acelera las lecturas por rango.
DailyRollupEntitySchema.index(
  { ownerType: 1, ownerId: 1, day: 1 },
  { unique: true },
);
