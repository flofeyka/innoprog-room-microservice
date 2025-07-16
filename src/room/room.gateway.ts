import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { fillDto } from 'helpers/fill-dto/fill-dto';
import { Server, Socket } from 'socket.io';
import { EditRoomDto } from './dto/edit-room-dto';
import { RoomRdo } from './rdo/room-rdo';
import { RoomPersistenceService } from './room-persistence.service';
import { RoomService } from './room.service';
import * as Y from 'yjs';
import { PrismaService } from '../prisma/prisma.service';

interface JoinPayload {
  telegramId?: string;
  username?: string;
  roomId: string;
}

interface Member {
  clientId: string;
  telegramId: string;
  username?: string;
  online: boolean;
  lastCursorPosition?: [number, number];
  lastSelection?: {
    line?: number;
    column?: number;
    selectionStart?: { line: number; column: number };
    selectionEnd?: { line: number; column: number };
    selectedText?: string;
  };
  userColor?: string;
  lastActivity?: Date;
}

interface Room {
  id: string;
  members: Member[];
  teacher: string;
  studentCursorEnabled: boolean;
  studentSelectionEnabled: boolean;
  studentEditCodeEnabled: boolean;
  completed: boolean;
  lastCode?: string;
}

interface EditPayload extends EditRoomDto {
  id: string;
  roomId: string;
}

interface Log {
  telegramId: string;
  cursor: number[];
}

interface CursorPayload {
  roomId: string;
  position: number[];
  logs: Log[];
  telegramId: string;
}

interface SelectionPayload {
  roomId: string;
  telegramId: string;
  // Для курсора
  line?: number;
  column?: number;
  // Для выделения фрагмента
  selectionStart?: {
    line: number;
    column: number;
  };
  selectionEnd?: {
    line: number;
    column: number;
  };
  selectedText?: string;
  // Флаг для явной очистки выделения
  clearSelection?: boolean;
}

interface CodeEditPayload {
  roomId: string;
  telegramId: string;
  update: Uint8Array;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private docs = new Map<string, Y.Doc>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly roomService: RoomService,
    private readonly roomPersistenceService: RoomPersistenceService,
    private readonly prisma: PrismaService,
  ) {}

  activeRooms: Room[] = [];

  @WebSocketServer()
  server: Server;

  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#85929E',
      '#D7BDE2',
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: JoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { telegramId, roomId, username } = data;

    const currentTelegramId =
      telegramId || `i${Math.floor(Math.random() * 1000000)}`;

    let room = await this.roomService.getRoom(roomId);

    if (!room) {
      client.emit('join-room:error', { message: 'Комната не найдена' });
      return;
    }

    const isParticipant =
      room.teacher === currentTelegramId ||
      room.students.includes(currentTelegramId);

    if (!isParticipant) {
      room = await this.roomService.joinRoom(room.id, currentTelegramId);
    }

    // Сохраняем или обновляем участника в БД
    try {
      await this.roomPersistenceService.upsertRoomMember(
        roomId,
        currentTelegramId,
        username,
      );
    } catch (error) {
      console.error('Error saving room member:', error);
    }

    await client.join(roomId);

    let activeRoom = this.activeRooms.find((r) => r.id === room.id);

    if (!activeRoom) {
      activeRoom = {
        ...room,
        members: [],
        studentCursorEnabled: room.studentCursorEnabled ?? true,
        studentSelectionEnabled: room.studentSelectionEnabled ?? true,
        studentEditCodeEnabled: room.studentEditCodeEnabled ?? true,
        completed: room.completed,
        teacher: room.teacher,
        lastCode: room.roomState?.lastCode || undefined,
      };
      this.activeRooms.push(activeRoom);

      // Если это первый участник, загружаем состояние из БД
      try {
        const roomState =
          await this.roomPersistenceService.getRoomState(roomId);
        if (roomState && roomState.lastCode) {
          // Отправляем сохраненный код первому участнику
          setTimeout(() => {
            client.emit('room-state-loaded', {
              lastCode: roomState.lastCode,
              participantCount: roomState.participantCount,
            });
          }, 500);
        }
      } catch (error) {
        console.error('Error loading room state:', error);
      }
    }

    const existingMember = activeRoom?.members.find(
      (member) => member.telegramId === currentTelegramId,
    );

    if (existingMember) {
      existingMember.online = true;
      existingMember.clientId = client.id;
      existingMember.lastActivity = new Date();
      if (username) {
        existingMember.username = username;
      }
    } else {
      activeRoom?.members.push({
        clientId: client.id,
        telegramId: currentTelegramId,
        username,
        online: true,
        userColor: this.generateUserColor(currentTelegramId),
        lastActivity: new Date(),
      });
    }

    // Обновляем счетчик участников в БД
    try {
      await this.roomPersistenceService.incrementParticipantCount(roomId);
    } catch (error) {
      console.error('Error incrementing participant count:', error);
    }

    // Отправляем обновленный список участников всем в комнате
    this.server.to(roomId).emit('members-updated', {
      members: activeRoom?.members.map((member) => ({
        telegramId: member.telegramId,
        username: member.username,
        online: member.online,
        userColor: member.userColor,
        lastActivity: member.lastActivity,
      })),
      trigger: 'join',
      telegramId: currentTelegramId,
    });

    const currentCursors = activeRoom?.members
      .filter((m) => m.lastCursorPosition && m.online)
      .map((m) => ({
        telegramId: m.telegramId,
        position: m.lastCursorPosition,
        userColor: m.userColor,
        username: m.username,
      }));

    const currentSelections = activeRoom.members
      .filter((m) => m.lastSelection && m.online)
      .map((m) => ({
        telegramId: m.telegramId,
        ...m.lastSelection,
        userColor: m.userColor,
        username: m.username,
      }));

    client.emit('joined', {
      telegramId: currentTelegramId,
      currentCursors,
      currentSelections,
      userColor:
        existingMember?.userColor || this.generateUserColor(currentTelegramId),
      isTeacher: room.teacher === telegramId,
      roomPermissions: {
        studentCursorEnabled: activeRoom?.studentCursorEnabled,
        studentSelectionEnabled: activeRoom?.studentSelectionEnabled,
        studentEditCodeEnabled: activeRoom?.studentEditCodeEnabled,
      },
      language: room.language,
      completed: room.completed,
      lastCode: activeRoom?.lastCode,
    });
  }

  @SubscribeMessage('edit-room')
  async handleEditRoom(client: Socket, @MessageBody() data: EditPayload) {
    const room = await this.roomService.getRoom(data.roomId);

    if (!room || room.teacher !== data.id) {
      client.emit('error', { message: 'Комната не найдена' });
      return;
    }
    if (room.completed) return;

    const updatedRoom = await this.roomService.editRoom(room.id, {
      studentCursorEnabled: data.studentCursorEnabled,
      studentEditCodeEnabled: data.studentEditCodeEnabled,
      studentSelectionEnabled: data.studentSelectionEnabled,
      language: data.language,
      taskId: data.taskId,
    });

    this.activeRooms = this.activeRooms.map((activeRoom) => {
      if (activeRoom.id === updatedRoom.id) {
        return {
          ...activeRoom,
          studentCursorEnabled: Boolean(data.studentCursorEnabled),
          studentEditCodeEnabled: Boolean(data.studentEditCodeEnabled),
          studentSelectionEnabled: Boolean(data.studentSelectionEnabled),
        };
      }

      return activeRoom;
    });

    this.server
      .to(data.roomId)
      .emit('room-edited', fillDto(RoomRdo, updatedRoom));
  }

  @SubscribeMessage('cursor')
  handleCursor(client: Socket, data: CursorPayload) {
    const activeRoom = this.activeRooms.find((room) => room.id === data.roomId);

    if (!activeRoom) {
      client.emit('error', { message: 'Комната не найдена' });
      return;
    }

    if (activeRoom.completed) return;

    if (!activeRoom.studentCursorEnabled) return;

    if (data.position.length !== 2) {
      client.emit('error', {
        message: 'Позиция по курсору может иметь только два значения - x, y',
      });
      return;
    }

    const member = activeRoom.members.find(
      (m) => m.telegramId === data.telegramId,
    );
    if (member) {
      member.lastCursorPosition = [data.position[0], data.position[1]];
      member.lastActivity = new Date();
    }

    const cursorData = {
      ...data,
      userColor: member?.userColor,
      username: member?.username,
    };

    this.server.to(activeRoom.id).emit('cursor-action', cursorData);
  }

  @SubscribeMessage('selection')
  handleSelection(client: Socket, data: SelectionPayload) {
    const activeRoom = this.activeRooms.find((room) => room.id === data.roomId);

    if (!activeRoom) {
      return client.emit('error', {
        message: 'Комната не найдена',
      });
    }

    if (activeRoom.completed) return;

    if (!activeRoom.studentSelectionEnabled) return;

    if (!data.telegramId) {
      return client.emit('error', {
        message: 'Недостаточно данных. Проверите telegramId',
      });
    }

    const member = activeRoom.members.find(
      (m) => m.telegramId === data.telegramId,
    );

    if (member) {
      member.lastActivity = new Date();

      // Сохраняем последнее выделение пользователя
      if (
        data.line &&
        typeof data.column === 'number' &&
        (!data.selectionStart || !data.selectionEnd || !data.selectedText)
      ) {
        // Очищаем выделение - оставляем только курсор
        member.lastSelection = {
          line: data.line,
          column: data.column,
        };
      } else if (
        data.selectionStart &&
        data.selectionEnd &&
        data.selectedText
      ) {
        // Сохраняем выделение текста
        member.lastSelection = {
          selectionStart: data.selectionStart,
          selectionEnd: data.selectionEnd,
          selectedText: data.selectedText,
        };
      }
    }

    // Отправляем все актуальные выделения комнаты
    const currentSelections = activeRoom.members
      .filter((m) => m.online)
      .map((m) => ({
        telegramId: m.telegramId,
        ...m.lastSelection,
        userColor: m.userColor,
        username: m.username,
      }));

    this.server.to(activeRoom.id).emit('selection-state', {
      selections: currentSelections,
      updatedUser: data.telegramId,
    });
  }

  @SubscribeMessage('code-edit')
  handleCodeEdit(client: Socket, data: CodeEditPayload) {
    const activeRoom = this.activeRooms.find((room) => room.id === data.roomId);

    if (!activeRoom) {
      return client.emit('error', {
        message: 'Комната не найдена',
      });
    }

    if (activeRoom.completed) return;

    if (
      !activeRoom.studentEditCodeEnabled &&
      data.telegramId !== activeRoom.teacher
    ) {
      return client.emit('error', {
        message: 'Редактирование кода отключено в этой комнате',
      });
    }

    if (!data.telegramId) {
      return client.emit('error', {
        message: 'Не указан telegramId',
      });
    }

    const member = activeRoom.members.find(
      (m) => m.telegramId === data.telegramId,
    );

    if (member) {
      member.lastActivity = new Date();
    }

    const doc = this.getOrCreateDoc(data.roomId);

    // Отправляем изменения всем участникам комнаты, кроме отправителя
    Y.applyUpdate(doc, data.update);

    // Рассылаем другим участникам
    client.to(data.roomId).emit('code-edit-action', {
      telegramId: data.telegramId,
      userColor: member?.userColor,
      username: member?.username,
      update: data.update,
    });

    // Пример автосохранения раз в 5 секунд после последнего изменения
    if (this.timers.has(data.roomId))
      clearTimeout(this.timers.get(data.roomId));
    this.timers.set(
      data.roomId,
      setTimeout(async () => {
        const code = doc.getText('codemirror').toString();

        await this.prisma.roomState.upsert({
          where: { roomId: data.roomId },
          update: { lastCode: code || '' },
          create: {
            roomId: data.roomId,
            lastCode: code,
          },
        });
      }, 1000),
    );

    client.emit('code-edit-confirmed', {
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('edit-member')
  async handleEditMember(client: Socket, data: JoinPayload) {
    const activeRoom = this.activeRooms.find((room) => room.id === data.roomId);

    if (!activeRoom) {
      return client.emit('error', { message: 'Комната не найдена' });
    }

    if (activeRoom.completed) return;

    const member = activeRoom.members.find(
      (m) => m.telegramId === data.telegramId,
    );

    if (member) {
      const oldUsername = member.username;
      member.username = data.username;

      // Сохраняем в БД
      try {
        await this.roomPersistenceService.updateRoomMemberUsername(
          data.roomId,
          data.telegramId!,
          data.username || '',
        );
        console.log(
          `👤 Member ${data.telegramId} updated username from "${oldUsername}" to "${data.username}"`,
        );
      } catch (error) {
        console.error('Error updating username in DB:', error);
      }

      // Отправляем обновление участника всем в комнате
      this.server.to(activeRoom.id).emit('members-updated', {
        members: activeRoom.members.map((member) => ({
          telegramId: member.telegramId,
          username: member.username,
          online: member.online,
          userColor: member.userColor,
          lastActivity: member.lastActivity,
        })),
        trigger: 'username-update',
        telegramId: data.telegramId,
      });
    } else {
      return client.emit('error', { message: 'Участник не найден в комнате' });
    }
  }

  @SubscribeMessage('close-session')
  async handleCloseSession(client: Socket, data: JoinPayload) {
    const activeRoom = await this.roomService.getRoom(data.roomId);

    if (!activeRoom || activeRoom.teacher !== data.telegramId) {
      client.emit('error', {
        message: 'Комната не найдена',
      });
      return;
    }

    if (activeRoom.completed) return;

    await this.roomService.completeRoom(data.roomId);

    console.log('🏁 Room completed by teacher:', data.telegramId);

    this.activeRooms = this.activeRooms.filter(
      (room) => room.id !== activeRoom.id,
    );

    this.server.to(activeRoom.id).emit('complete-session', {
      message: 'Учитель завершил сессию',
    });
  }

  handleDisconnect(client: Socket) {
    console.log('🔌 Client disconnected:', client.id);

    for (const room of this.activeRooms) {
      const member = room.members.find((m) => m.clientId === client.id);
      if (member) {
        console.log('👤 Member leaving room:', {
          telegramId: member.telegramId,
          username: member.username,
          roomId: room.id,
          clientId: client.id,
        });

        member.online = false;
        // Очищаем выделение пользователя
        member.lastSelection = undefined;

        // Уменьшаем счетчик участников в БД
        try {
          this.roomPersistenceService.decrementParticipantCount(room.id);
        } catch (error) {
          console.error('Error decrementing participant count:', error);
        }

        this.server.to(room.id).emit('member-left', {
          telegramId: member.telegramId,
          keepCursor: true,
        });

        // Отправляем обновленный список участников всем в комнате
        this.server.to(room.id).emit('members-updated', {
          members: room.members.map((member) => ({
            telegramId: member.telegramId,
            username: member.username,
            online: member.online,
            userColor: member.userColor,
            lastActivity: member.lastActivity,
          })),
          trigger: 'leave',
          telegramId: member.telegramId,
        });

        // Отправляем обновленное состояние выделений
        const currentSelections = room.members
          .filter((m) => m.lastSelection && m.online)
          .map((m) => ({
            telegramId: m.telegramId,
            ...m.lastSelection,
            userColor: m.userColor,
          }));

        this.server.to(room.id).emit('selection-state', {
          selections: currentSelections,
          updatedUser: member.telegramId,
        });

        // Проверяем, остались ли онлайн участники
        const onlineMembers = room.members.filter((m) => m.online);
        if (onlineMembers.length === 0) {
          console.log(
            `🏠 Room ${room.id} is now empty, performing final save...`,
          );

          // Если комната опустела, сохраняем финальное состояние и удаляем из активных
          try {
            this.roomPersistenceService.updateRoomState(room.id, {
              participantCount: 0,
            });
            console.log(`💾 Final state saved for room ${room.id}`);
          } catch (error) {
            console.error('Error saving final room state:', error);
          }

          // Удаляем комнату из активных
          const roomIndex = this.activeRooms.findIndex((r) => r.id === room.id);
          if (roomIndex > -1) {
            this.activeRooms.splice(roomIndex, 1);
            console.log(`🗑️ Removed room ${room.id} from active rooms`);
          }
        }

        break;
      }
    }
  }

  private getOrCreateDoc(roomId: string): Y.Doc {
    if (!this.docs.has(roomId)) {
      const doc = new Y.Doc();
      this.docs.set(roomId, doc);
    }
    return this.docs.get(roomId)!;
  }

  handleConnection(client: any, ...args: any[]) {}
}
