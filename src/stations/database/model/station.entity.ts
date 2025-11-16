import { LocationEntity, LocationEntitySchema } from './location.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  StationMeasurementEntity,
  StationMeasurementEntitySchema,
} from './station-measurement.entity';

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

  @ApiProperty()
  @Prop({ type: StationMeasurementEntitySchema, default: {} })
  @Type(() => StationMeasurementEntity)
  currentMeasurement: StationMeasurementEntity;

  @ApiProperty()
  @Prop({ type: String, required: false })
  @Type(() => String)
  stationGroupId?: string;

  @ApiProperty()
  _id: any;
}

export const StationSchema = SchemaFactory.createForClass(StationEntity);
