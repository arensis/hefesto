import { LocationEntity } from './location.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MeasurementEntity } from './measurement.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export type StationDocument = HydratedDocument<StationEntity>;

@Schema({ collection: 'stations', timestamps: true })
export class StationEntity {
  @ApiProperty()
  @Prop({ type: Date })
  createdDate: Date;

  @ApiProperty()
  @Prop({ type: LocationEntity })
  @Type(() => LocationEntity)
  location: LocationEntity;

  @ApiProperty({ type: MeasurementEntity, isArray: true })
  @Prop({
    childSchemas: [{ type: MeasurementEntity }],
  })
  measurements: MeasurementEntity[];
}

export const StationSchema = SchemaFactory.createForClass(StationEntity);
