import { Module } from '@nestjs/common';
import { RoomModule } from './room/room.module';
import { AppService } from './app.service';

@Module({
  imports: [RoomModule],
  controllers: [],
  providers: [AppService],
  exports: [AppService]
})
export class AppModule { }
