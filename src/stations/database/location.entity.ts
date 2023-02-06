import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type LocationEntityDocument = HydratedDocument<LocationEntity>;

@Schema({ collection: 'location' })
export class LocationEntity {
  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  indoor: boolean;

  @ApiProperty()
  @Prop()
  city: string;

  @ApiProperty()
  @Prop()
  latitude: number;

  @ApiProperty()
  @Prop()
  longitude: number;
}

export const LocationEntitySchema =
  SchemaFactory.createForClass(LocationEntity);
