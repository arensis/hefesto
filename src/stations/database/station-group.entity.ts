import { StationEntity } from './model/station.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StationGroupDocument = HydratedDocument<StationGroupEntity>;

@Schema({ collection: 'station_groups', timestamps: true })
export class StationGroupEntity extends StationEntity {
  @ApiProperty({ type: String, isArray: true })
  @Prop({ type: String, isArray: true })
  stations: string[];

  @ApiProperty()
  _id: any;
}

export const StationGroupSchema =
  SchemaFactory.createForClass(StationGroupEntity);
