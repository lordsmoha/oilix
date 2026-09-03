import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin:
      process.env.CORS_ORIGIN?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [
        'http://localhost:3000',
        'http://localhost:8081',
        'exp://localhost:8081',
      ],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    this.realtimeService.setServer(this.server);
    this.logger.log('Realtime gateway ready (/realtime)');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, isActive: true, deletedAt: null },
        select: { id: true, username: true },
      });
      if (!user) {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      client.data.username = user.username;

      const seasonId =
        (client.handshake.query.seasonId as string | undefined) ??
        (client.handshake.auth?.seasonId as string | undefined);

      if (seasonId) {
        await client.join(`season:${seasonId}`);
        client.data.seasonId = seasonId;
      }

      client.emit('connected', {
        userId: user.id,
        seasonId: seasonId ?? null,
      });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.data.userId ?? 'unknown'}`);
  }

  @SubscribeMessage('join-season')
  async handleJoinSeason(client: Socket, seasonId: string) {
    if (!client.data.userId || typeof seasonId !== 'string' || !seasonId) return;

    const prev = client.data.seasonId as string | undefined;
    if (prev) await client.leave(`season:${prev}`);
    await client.join(`season:${seasonId}`);
    client.data.seasonId = seasonId;
    return { ok: true, seasonId };
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token;
    if (typeof auth === 'string' && auth.length > 0) return auth;

    const query = client.handshake.query?.token;
    if (typeof query === 'string' && query.length > 0) return query;

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  }
}
