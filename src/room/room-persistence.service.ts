import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomPersistenceService {
  private readonly logger: Logger = new Logger(RoomPersistenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Методы для работы с участниками
  async upsertRoomMember(
    roomId: string,
    telegramId: string,
    username?: string,
  ) {
    try {
      return await this.prisma.$queryRaw`
        INSERT INTO room_members (id, "telegramId", username, "roomId", "joinedAt", "updatedAt")
        VALUES (gen_random_uuid(), ${telegramId}, ${username || null}, ${roomId}, NOW(), NOW())
        ON CONFLICT ("telegramId", "roomId") 
        DO UPDATE SET username = ${username || null}, "updatedAt" = NOW()
        RETURNING *;
      `;
    } catch (error) {
      this.logger.error(`Error upserting room member: ${error.message}`);
      throw error;
    }
  }

  async getRoomMembers(roomId: string) {
    try {
      return await this.prisma.$queryRaw`
        SELECT * FROM room_members 
        WHERE "roomId" = ${roomId} 
        ORDER BY "joinedAt" ASC;
      `;
    } catch (error) {
      this.logger.error(`Error getting room members: ${error.message}`);
      return [];
    }
  }

  async updateRoomMemberUsername(
    roomId: string,
    telegramId: string,
    username: string,
  ) {
    try {
      return await this.prisma.$queryRaw`
        UPDATE room_members 
        SET username = ${username}, "updatedAt" = NOW()
        WHERE "telegramId" = ${telegramId} AND "roomId" = ${roomId}
        RETURNING *;
      `;
    } catch (error) {
      this.logger.error(
        `Error updating room member username: ${error.message}`,
      );
      throw error;
    }
  }

  // Методы для работы с состоянием комнаты
  async getRoomState(roomId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM room_states 
        WHERE "roomId" = ${roomId} 
        LIMIT 1;
      `;
      return Array.isArray(result) ? result[0] : null;
    } catch (error) {
      this.logger.error(`Error getting room state: ${error.message}`);
      return null;
    }
  }

  async updateRoomState(
    roomId: string,
    data: {
      lastCode?: string;
      participantCount?: number;
    },
  ) {
    try {
      return await this.prisma.$queryRaw`
        INSERT INTO room_states (id, "roomId", "lastCode", "participantCount", "lastActivity", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${roomId}, ${data.lastCode || null}, ${data.participantCount || 0}, NOW(), NOW(), NOW())
        ON CONFLICT ("roomId") 
        DO UPDATE SET 
          "lastCode" = COALESCE(${data.lastCode || null}, room_states."lastCode"),
          "participantCount" = COALESCE(${data.participantCount}, room_states."participantCount"),
          "lastActivity" = NOW(),
          "updatedAt" = NOW()
        RETURNING *;
      `;
    } catch (error) {
      this.logger.error(`Error updating room state: ${error.message}`);
      throw error;
    }
  }

  async incrementParticipantCount(roomId: string) {
    try {
      return await this.prisma.$queryRaw`
        INSERT INTO room_states (id, "roomId", "participantCount", "lastActivity", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${roomId}, 1, NOW(), NOW(), NOW())
        ON CONFLICT ("roomId") 
        DO UPDATE SET 
          "participantCount" = room_states."participantCount" + 1,
          "lastActivity" = NOW(),
          "updatedAt" = NOW()
        RETURNING *;
      `;
    } catch (error) {
      this.logger.error(
        `Error incrementing participant count: ${error.message}`,
      );
      throw error;
    }
  }

  async decrementParticipantCount(roomId: string) {
    try {
      return await this.prisma.$queryRaw`
        UPDATE room_states 
        SET 
          "participantCount" = GREATEST(room_states."participantCount" - 1, 0),
          "lastActivity" = NOW(),
          "updatedAt" = NOW()
        WHERE "roomId" = ${roomId}
        RETURNING *;
      `;
    } catch (error) {
      this.logger.error(
        `Error decrementing participant count: ${error.message}`,
      );
      throw error;
    }
  }

  async saveLastCode(roomId: string, code: string) {
    try {
      return await this.updateRoomState(roomId, { lastCode: code });
    } catch (error) {
      this.logger.error(`Error saving last code: ${error.message}`);
      throw error;
    }
  }
}
