import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class DeleteRoomDto {
    @ApiProperty({
        title: 'Crypted telegram id',
        example: 'string'
    })
    @IsString()
    telegramId: string;

    @ApiProperty({
        title: 'Room id',
        example: 'string'
    })
    @IsString()
    id: string;
}