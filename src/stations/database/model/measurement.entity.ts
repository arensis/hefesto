import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type MeasurementEntityDocument = HydratedDocument<MeasurementEntity>;

@Schema()
export class MeasurementEntity {
  @ApiProperty({ required: true })
  @Prop({ required: true })
  date: Date;

  @ApiProperty({ required: true })
  @Prop({ required: true })
  temperature: number;

  @ApiProperty({ required: false })
  @Prop({ required: false })
  humidity: number;

  @ApiProperty({ required: false })
  @Prop({ required: false })
  airPressure: number;
}

export const MeasurementEntitySchema =
  SchemaFactory.createForClass(MeasurementEntity);
