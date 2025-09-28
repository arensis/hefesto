import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type MeasurementEntityDocument = HydratedDocument<MeasurementEntity>;

@Schema()
export class MeasurementEntity {
  @ApiProperty()
  @Prop()
  date: Date;

  @ApiProperty()
  @Prop({ required: true })
  temperature: number;

  @ApiProperty()
  @Prop()
  humidity: number;

  @ApiProperty()
  @Prop()
  airPressure: number;
}

export const MeasurementEntitySchema =
  SchemaFactory.createForClass(MeasurementEntity);
