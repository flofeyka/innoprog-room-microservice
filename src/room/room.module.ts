import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomController } from './room.controller';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { RoomPersistenceService } from './room-persistence.service';

@Module({
  imports: [PrismaModule],
  providers: [RoomService, RoomGateway, RoomPersistenceService],
  controllers: [RoomController],
})
export class RoomModule {}
