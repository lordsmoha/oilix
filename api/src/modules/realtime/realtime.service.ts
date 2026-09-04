import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Namespace, Server } from 'socket.io';
import { REALTIME_EVENTS } from './realtime.constants';
import type {
  RealtimeConflictPayload,
  RealtimeEmitInput,
  RealtimeSyncPayload,
} from './realtime.types';

type SocketServerLike = Server | Namespace;

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: SocketServerLike | null = null;

  setServer(server: SocketServerLike) {
    this.server = server;
    const name =
      server && typeof (server as Namespace).name === 'string'
        ? (server as Namespace).name
        : '(root)';
    this.logger.log(`Realtime server bound (${name})`);
  }

  /** Resolve the /realtime namespace whether Nest injected Namespace or root Server. */
  private getNsp(): Namespace | Server | null {
    if (!this.server) return null;
    const s = this.server as Server & Namespace;
    if (typeof s.name === 'string' && s.name === '/realtime') return s;
    if (typeof (s as Server).of === 'function') {
      return (s as Server).of('/realtime');
    }
    return s;
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

    const nsp = this.getNsp();
    if (!nsp) {
      this.logger.warn(
        `Realtime skipped (no server): ${payload.entity}/${payload.action}`,
      );
      return payload;
    }

    // Broadcast once to every client on /realtime (room join is optional).
    // Do not also emit on the root `/` namespace — web clients never hear that.
    nsp.emit(REALTIME_EVENTS.SYNC, payload);

    if (payload.entity === 'notification') {
      this.logger.log(
        `Realtime notification → /realtime (${payload.notification?.title ?? payload.entityId})`,
      );
    } else {
      this.logger.debug(
        `Realtime ${payload.entity}/${payload.action} → /realtime`,
      );
    }
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

    const nsp = this.getNsp();
    if (!nsp) return;

    const room = this.roomForSeason(seasonId);
    if (room) {
      nsp.to(room).emit(REALTIME_EVENTS.CONFLICT, payload);
    }
    nsp.emit(REALTIME_EVENTS.CONFLICT, payload);
  }
}
