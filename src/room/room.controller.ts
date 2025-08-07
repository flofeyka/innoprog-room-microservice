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
  UseGuards,
  UsePipes,
  ValidationPipe,
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
import { AuthRoomGuard } from './auth-room.guard';
import { DeleteRoomDto } from './dto/delete-room-dto';

@ApiTags('Room')
@Controller('room')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class RoomController {
  constructor(private readonly roomService: RoomService) { }

  @ApiOperation({ summary: 'Create room' })
  @ApiResponse({ status: 200, type: RoomRdo })
  @UseGuards(AuthRoomGuard)
  @Post('/')
  async createRoom(@Body() dto: CreateRoomDto): Promise<RoomRdo> {
    return await this.roomService.createRoom(dto);
  }

  @ApiOperation({ summary: 'Get all rooms by telegram id ' })
  @ApiResponse({ status: 200, type: [RoomRdo] })
  @UseGuards(AuthRoomGuard)
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
  @UseGuards(AuthRoomGuard)
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
  @UseGuards(AuthRoomGuard)
  @Delete('/')
  async deleteRoom(@Body() dto: DeleteRoomDto): Promise<{ success: boolean }> {
    console.log(dto);
    return await this.roomService.deleteRoom(dto.id, dto.telegramId);
  }
}
