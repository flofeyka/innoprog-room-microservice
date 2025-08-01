import { Injectable } from "@nestjs/common";
import * as crypto from 'crypto';

@Injectable()
export class AppService {
    decryptTelegramId(telegramId: string): string | null {
        try {
            const { ENCRYPT_TELEGRAM_ID_KEY, ENCRYPT_TELEGRAM_ID_IV } = process.env;
            if (!ENCRYPT_TELEGRAM_ID_IV || !ENCRYPT_TELEGRAM_ID_KEY) return null;
            const key: Buffer = Buffer.from(ENCRYPT_TELEGRAM_ID_KEY, 'base64');
            const iv: Buffer = Buffer.from(ENCRYPT_TELEGRAM_ID_IV, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(telegramId, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            console.error(e)
            return null
        }
    }
};