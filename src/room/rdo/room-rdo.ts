import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RoomRdo {
  @ApiProperty({
    title: 'Room id',
    example: 'b5269a83-72cb-47ee-b8ab-4a7768565080',
  })
  @Expose()
  public id: string;

  @ApiProperty({ title: 'Teacher telegram id', example: '54232526524' })
  @Expose()
  public teacher: string;

  @ApiProperty({ title: 'Students', example: ['4524263461', '4532452345'] })
  @Expose()
  public students: string;
}
