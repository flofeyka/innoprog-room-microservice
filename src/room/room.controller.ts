import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRoomDto } from './dto/create-room-dto';
import { EditRoomDto } from './dto/edit-room-dto';
import { GetRoomsDto } from './dto/get-rooms-dto';
import { RoomRdo } from './rdo/room-rdo';
import { RoomService } from './room.service';

@ApiTags('Room')
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiOperation({ summary: 'Create room' })
  @ApiResponse({ status: 200, type: RoomRdo })
  @Post('/')
  async createRoom(@Body() dto: CreateRoomDto): Promise<RoomRdo> {
    return await this.roomService.createRoom(dto);
  }

  @ApiOperation({ summary: 'Get all rooms by telegram id ' })
  @ApiResponse({ status: 200, type: [RoomRdo] })
  @Get('/:telegramId')
  async getRooms(
    @Param('telegramId') telegramId: string,
    @Query() dto: GetRoomsDto,
  ): Promise<{ rooms: RoomRdo[]; total: number }> {
    return await this.roomService.getRooms(telegramId, dto);
  }

  @ApiOperation({ summary: 'Edit an existing room' })
  @ApiResponse({ status: 200, type: RoomRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Room not found').getResponse(),
  })
  @Put('/:id')
  async editRoom(
    @Param('id') id: string,
    @Body() dto: EditRoomDto,
  ): Promise<RoomRdo> {
    return await this.roomService.editRoom(id, dto);
  }

  @ApiOperation({ summary: 'Delete a room' })
  @ApiResponse({ status: 200, example: { success: true } })
  @ApiNotFoundResponse({
    example: new NotFoundException('Room not found').getResponse(),
  })
  @Delete('/:id')
  async deleteRoom(@Param('id') id: string): Promise<{ success: boolean }> {
    return await this.roomService.deleteRoom(id);
  }
}
