import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { RoomService } from "./room.service";
import { AppService } from "src/app.service";

@Injectable()
export class AuthRoomGuard implements CanActivate {
    constructor(private readonly appService: AppService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const data = context.switchToWs().getData();
        const client = context.switchToWs().getClient();

        console.log('Data:', data);

        const telegramId = data.telegramId ? data.telegramId.startsWith('i') ? data.telegramId : this.appService.decryptTelegramId(data.telegramId) : `i${Math.floor(Math.random() * 1000000)}`;

        console.log('telegramId: ', telegramId);

        if (!telegramId || (!telegramId.startsWith('i') && isNaN(Number(telegramId)))) {
            client.emit('join-room:error', { message: 'Неверная ссылка. Пожалуйста, обратитесь к администратору' });
            return false;
        }

        data.telegramId = telegramId;

        return true;
    }
}