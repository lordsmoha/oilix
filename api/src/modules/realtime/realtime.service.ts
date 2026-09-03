import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Server } from 'socket.io';
import { REALTIME_EVENTS } from './realtime.constants';
import type {
  RealtimeConflictPayload,
  RealtimeEmitInput,
  RealtimeSyncPayload,
} from './realtime.types';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  private roomForSeason(seasonId?: string) {
    return seasonId ? `season:${seasonId}` : null;
  }

  emit(input: RealtimeEmitInput) {
    const payload: RealtimeSyncPayload = {
      ...input,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    if (!this.server) {
      this.logger.debug(`Realtime skipped (no server): ${payload.entity}/${payload.action}`);
      return payload;
    }

    const room = this.roomForSeason(payload.seasonId);
    if (room) {
      this.server.to(room).emit(REALTIME_EVENTS.SYNC, payload);
    }
    this.server.emit(REALTIME_EVENTS.SYNC, payload);
    this.logger.debug(`Realtime ${payload.entity}/${payload.action} → ${room ?? 'all'}`);
    return payload;
  }

  emitConflict(
    entity: RealtimeEmitInput['entity'],
    entityId: string,
    serverUpdatedAt: Date,
    seasonId?: string,
  ) {
    const payload: RealtimeConflictPayload = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      entity,
      entityId,
      serverUpdatedAt: serverUpdatedAt.toISOString(),
      message: 'تم تعديل السجل من مستخدم آخر. يرجى تحديث البيانات وإعادة المحاولة.',
    };

    if (!this.server) return;

    const room = this.roomForSeason(seasonId);
    if (room) {
      this.server.to(room).emit(REALTIME_EVENTS.CONFLICT, payload);
    }
    this.server.emit(REALTIME_EVENTS.CONFLICT, payload);
  }
}
