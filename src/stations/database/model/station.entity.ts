import { LocationEntity, LocationEntitySchema } from './location.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  MeasurementEntity,
  MeasurementEntitySchema,
} from './measurement.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export type StationDocument = HydratedDocument<StationEntity>;

@Schema({ collection: 'stations', timestamps: true })
export class StationEntity {
  @ApiProperty()
  @Prop({ type: Date })
  createdDate: Date;

  @ApiProperty()
  @Prop({ type: LocationEntitySchema })
  @Type(() => LocationEntity)
  location: LocationEntity;

  @ApiProperty({ type: MeasurementEntity, isArray: true })
  @Prop({ type: [MeasurementEntitySchema], default: [] })
  measurements: MeasurementEntity[];

  @ApiProperty()
  @Prop({ type: MeasurementEntitySchema, default: {} })
  @Type(() => MeasurementEntity)
  currentMeasurement: MeasurementEntity;

  @ApiProperty()
  @Prop({ type: String, required: false })
  @Type(() => String)
  stationGroupId?: string;

  @ApiProperty()
  _id: any;
}

export const StationSchema = SchemaFactory.createForClass(StationEntity);
