import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class EditRoomDto {
  @ApiProperty({
    title: 'Task id',
    example: '10007',
  })
  @IsOptional()
  @IsString()
  public taskId?: string;

  @ApiProperty({
    title: 'Programming language',
    enum: Language,
    example: Language.js,
  })
  @IsOptional()
  @IsEnum(Language)
  public language?: Language;

  @ApiProperty({
    title: 'Should cursor be enabled for students',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  public studentCursorEnabled: boolean;

  @ApiProperty({
    title: 'Should selection be enabled for students',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  public studentSelectionEnabled: boolean;

  @ApiProperty({
    title: 'Should code editing be enabled for students',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  public studentEditCodeEnabled: boolean;

  @ApiProperty({
    title: 'Crypted telegram id',
    example: 'b5269a83-72cb-47ee-b8ab-4a7768565080'
  })
  @IsString()
  public telegramId: string;
}
