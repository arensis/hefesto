import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Type } from 'class-transformer';
import { LocationEntitySchema, LocationEntity } from './location.entity';
import {
  StationMeasurementEntitySchema,
  StationMeasurementEntity,
} from './station-measurement.entity';

export type StationGroupDocument = HydratedDocument<StationGroupEntity>;

@Schema({ collection: 'station_groups', timestamps: true })
export class StationGroupEntity {
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
  currentMeasurement?: StationMeasurementEntity;

  @ApiProperty({ type: String, isArray: true })
  @Prop({ type: String, isArray: true })
  stations: string[];

  @ApiProperty()
  _id: any;
}

export const StationGroupSchema =
  SchemaFactory.createForClass(StationGroupEntity);
