import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { DateQueryDto, parseBucketMinutes } from '../dto/date-query.dto';
import { AggregateQueryDto, parsePeriod } from '../dto/aggregate-query.dto';
import { StationGroupDto } from '../dto/station.group.dto';
import { StationGroupResponseDto } from '../dto/station-group-response.dto';
import { StationGroupsService } from '../services/database/station-groups.service';
import { StationGroupEntity } from '../database/model/station-group.entity';
import { StationGroupsOrchestrator } from '../services/database/transactions/station-groups-orchestrator.service';

@ApiTags('station-groups')
@Controller('station-groups')
export class StationGroupsController {
  constructor(
    private readonly stationGroupsService: StationGroupsService,
    private readonly stationGroupsOrchestrator: StationGroupsOrchestrator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all station groups' })
  @ApiOkResponse({
    type: StationGroupEntity,
    isArray: true,
  })
  async findAll(): Promise<StationGroupResponseDto[]> {
    return this.stationGroupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a single station broup by id',
  })
  @ApiOkResponse({ type: StationGroupEntity })
  async findById(@Param('id') id: string): Promise<StationGroupResponseDto> {
    return await this.stationGroupsService.findById(id);
  }

  @Get(':id/measurements')
  @ApiOperation({
    summary: 'Historico de la media del grupo por dia (con downsampling)',
  })
  async findMeasurementsByIdAndDate(
    @Param('id') id: string,
    @Query() queryDto: DateQueryDto,
  ) {
    return this.stationGroupsService.findMeasurementsBy(
      id,
      new Date(queryDto.date),
      parseBucketMinutes(queryDto.bucketMinutes),
    );
  }

  @Get(':id/aggregates')
  @ApiOperation({
    summary: 'Agregados (media/min/max) por dia, mes o anio del grupo',
  })
  async getAggregates(
    @Param('id') id: string,
    @Query() queryDto: AggregateQueryDto,
  ) {
    return this.stationGroupsService.getAggregates(
      id,
      parsePeriod(queryDto.period),
      new Date(queryDto.date),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new station group' })
  @ApiAcceptedResponse({ type: StationGroupEntity })
  async create(
    @Body() stationGroupDto: StationGroupDto,
  ): Promise<StationGroupEntity> {
    return this.stationGroupsService.create(stationGroupDto);
  }

  @Patch('/:id/stations/:stationId')
  @ApiOperation({ summary: 'Add a new station to the group' })
  @ApiAcceptedResponse({
    type: StationGroupEntity,
  })
  async addStation(
    @Param('id') id: string,
    @Param('stationId') stationId: string,
  ): Promise<StationGroupEntity> {
    return this.stationGroupsOrchestrator.addStationToGroupTransactional(
      id,
      stationId,
    );
  }

  @Delete('/:id/stations/:stationId')
  @ApiOperation({ summary: 'Delete a station from the group' })
  @ApiAcceptedResponse({
    type: StationGroupEntity,
  })
  async deleteStation(
    @Param('id') id: string,
    @Param('stationId') stationId: string,
  ): Promise<StationGroupEntity> {
    return this.stationGroupsOrchestrator.deleteStationFromGroupTransactional(
      id,
      stationId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete station group' })
  @ApiAcceptedResponse()
  async delete(@Param('id') id: string) {
    return this.stationGroupsOrchestrator.deleteGroupWithDependencies(id);
  }
}
