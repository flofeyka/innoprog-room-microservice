import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
