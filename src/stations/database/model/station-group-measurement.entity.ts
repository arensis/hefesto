import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { HydratedDocument } from 'mongoose';

export type StationGroupMeasurementDocument =
  HydratedDocument<StationGroupMeasurementEntity>;

@Schema({ collection: 'station_group_measurements', timestamps: true })
export class StationGroupMeasurementEntity {
  @ApiProperty()
  @Prop({ type: String, required: true })
  @Type(() => String)
  stationGroupId: string;

  @ApiProperty()
  @Prop({ type: Date })
  date: Date;

  @ApiProperty({ required: true })
  @Prop({ required: true })
  temperature: number;

  @ApiProperty({ required: false })
  @Prop({ required: false })
  humidity?: number;

  @ApiProperty({ required: false })
  @Prop({ required: false })
  airPressure?: number;

  @ApiProperty()
  _id: any;
}

export const StationGroupMeasurementEntitySchema = SchemaFactory.createForClass(
  StationGroupMeasurementEntity,
);
