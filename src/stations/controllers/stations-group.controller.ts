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
} from '@nestjs/common';
import { StationGroupDto } from '../dto/station.group.dto';
import { StationGroupEntity } from '../database/station-group.entity';
import { StationGroupResponseDto } from '../dto/station-group-response.dto';
import { StationGroupsService } from '../services/station-groups.service';

@ApiTags('station-groups')
@Controller('station-groups')
export class StationGroupsController {
  constructor(private readonly stationGroupsService: StationGroupsService) {}

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
    return this.stationGroupsService.addStation(id, stationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete station group' })
  @ApiAcceptedResponse()
  async delete(@Param('id') id: string) {
    return this.stationGroupsService.delete(id);
  }
}
