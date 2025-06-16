import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { fillDto } from 'helpers/fill-dto/fill-dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room-dto';
import { GetRoomsDto } from './dto/get-rooms-dto';
import { RoomRdo } from './rdo/room-rdo';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(dto: CreateRoomDto): Promise<RoomRdo> {
    const room = await this.prisma.room.create({
      data: {
        teacher: dto.telegramId,
      },
    });

    return fillDto(RoomRdo, room);
  }

  async getRooms(dto: GetRoomsDto) {
    const { page = '1', limit = '5' } = dto;

    const where: Prisma.RoomWhereInput = {
      OR: [
        { teacher: dto.telegramId },
        {
          students: {
            has: dto.telegramId,
          },
        },
      ],
    };

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: (+page - 1) * +limit,
        take: +limit,
      }),
      this.prisma.room.count({ where }),
    ]);

    return { rooms, total };
  }
}
