import { DateQueryDto } from './dto/date-query.dto';
import { StationDto } from './dto/station.dto';
import { MeasurementDto } from './dto/measurement.dto';
import { StationsService } from './stations.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StationEntity } from './database/model/station.entity';
import { StationResponseDto } from './dto/station-response.dto';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'Find all the stations' })
  @ApiOkResponse({
    type: StationEntity,
    isArray: true,
  })
  async findAll(): Promise<StationResponseDto[]> {
    return this.stationService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a single station by id',
  })
  @ApiOkResponse({ type: StationEntity })
  async findById(@Param('id') id: string): Promise<StationResponseDto> {
    return await this.stationService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new station' })
  @ApiAcceptedResponse({ type: StationEntity })
  async create(@Body() stationDto: StationDto): Promise<StationEntity> {
    return this.stationService.create(stationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete station' })
  @ApiAcceptedResponse()
  async delete(@Param('id') id: string) {
    return this.stationService.delete(id);
  }

  @Get(':id/measurements')
  @ApiOperation({
    summary: 'Find measurements by station id and date',
  })
  @ApiOkResponse({ type: StationEntity })
  async findMeasurementsByIdAndDate(
    @Param('id') id: string,
    @Query() queryDto: DateQueryDto,
  ): Promise<MeasurementDto[]> {
    return this.stationService.findMeasurementsBy(id, new Date(queryDto.date));
  }

  @Patch('/:id/measurements')
  @ApiOperation({ summary: 'Add a new measurement to an specific station' })
  @ApiAcceptedResponse({
    type: StationEntity,
  })
  async addMeasurement(
    @Param('id') id: string,
    @Body() measurementDto: MeasurementDto,
  ): Promise<StationEntity> {
    return this.stationService.addMeasurement(id, measurementDto);
  }
}
