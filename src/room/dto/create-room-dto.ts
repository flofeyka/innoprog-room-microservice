import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EditRoomDto } from './edit-room-dto';

export class CreateRoomDto extends EditRoomDto {
}
