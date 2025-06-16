import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ title: 'Telegram id', example: '123214123' })
  @IsString()
  public telegramId: string;
}
