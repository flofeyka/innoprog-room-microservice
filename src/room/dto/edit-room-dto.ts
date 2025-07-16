import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class EditRoomDto {
  @ApiProperty({
    title: 'Should cursor be enabled for students',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  studentCursorEnabled: boolean;

  @ApiProperty({
    title: 'Should selection be enabled for students',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  studentSelectionEnabled: boolean;

  @ApiProperty({
    title: 'Should code editing be enabled for students',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  studentEditCodeEnabled: boolean;

  @ApiProperty({
    title: 'Task id',
    example: '10007',
  })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiProperty({
    title: 'Programming language',
    enum: Language,
    example: Language.js,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
