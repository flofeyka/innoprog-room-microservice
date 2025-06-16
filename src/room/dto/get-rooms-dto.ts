import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetRoomsDto {
  @ApiProperty({ title: 'Telegram id', example: '12542344234' })
  @IsString()
  public telegramId: string;

  @ApiProperty({ title: 'Page number', example: '1' })
  @IsOptional()
  @IsString()
  public page?: string;

  @ApiProperty({ title: 'Page size', example: '5' })
  @IsOptional()
  @IsString()
  public limit?: string;
}
