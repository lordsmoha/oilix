import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { paginatedMeta } from '../../common/dto/pagination.dto';

import { formatNum } from '../../common/audit/audit-format';

import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';

import { REALTIME_ENTITIES } from '../realtime/realtime.constants';

import { RealtimeService } from '../realtime/realtime.service';

import { NotificationQueryDto } from './dto/notification-query.dto';



export const NOTIFICATION_TYPES = {

  MOBILE_CLIENT_INTAKE: 'MOBILE_CLIENT_INTAKE',

  MOBILE_WEIGHING: 'MOBILE_WEIGHING',

  MOBILE_CLIENT_UPDATE: 'MOBILE_CLIENT_UPDATE',

  WEB_CLIENT_CREATE: 'WEB_CLIENT_CREATE',

  WEB_CLIENT_UPDATE: 'WEB_CLIENT_UPDATE',

  WEB_OLIVE_ENTRY: 'WEB_OLIVE_ENTRY',

  WEB_PROCESSING: 'WEB_PROCESSING',

  WEB_PRESSING: 'WEB_PRESSING',

  WEB_SEASON_NEW: 'WEB_SEASON_NEW',

  SYSTEM_CRITICAL: 'SYSTEM_CRITICAL',

} as const;



type DomainNotificationParams = {

  type: string;

  title: string;

  message: string;

  seasonId: string;

  module: string;

  action: string;

  clientName?: string;

  oliveTypeAr?: string;

  actorName: string;

  actorId?: string;

  source: 'web' | 'mobile';

  clientId?: string;

  entryId?: string;

  oliveType?: string;

  payload?: Record<string, unknown>;

};



@Injectable()

export class NotificationsService {

  constructor(

    private prisma: PrismaService,

    private realtime: RealtimeService,

  ) {}



  async findAll(query: NotificationQueryDto) {

    const page = query.page ?? 1;

    const limit = query.limit ?? 30;

    const where: Prisma.NotificationWhereInput = {

      ...(query.unreadOnly ? { read: false } : {}),

      ...(query.seasonId ? { seasonId: query.seasonId } : {}),

    };



    const [items, total, unreadCount] = await Promise.all([

      this.prisma.notification.findMany({

        where,

        skip: query.skip,

        take: limit,

        orderBy: { createdAt: 'desc' },

      }),

      this.prisma.notification.count({ where }),

      this.prisma.notification.count({ where: { read: false } }),

    ]);



    return {

      items,

      unreadCount,

      meta: paginatedMeta(total, page, limit),

    };

  }



  async markRead(id: string) {

    return this.prisma.notification.update({

      where: { id },

      data: { read: true },

    });

  }



  async markAllRead() {

    await this.prisma.notification.updateMany({

      where: { read: false },

      data: { read: true },

    });

    return { message: 'تم تعليم جميع الإشعارات كمقروءة' };

  }



  private async createAndBroadcast(params: DomainNotificationParams) {

    const notification = await this.prisma.notification.create({

      data: {

        type: params.type,

        title: params.title,

        message: params.message,

        seasonId: params.seasonId,

        payload: {

          clientName: params.clientName ?? '—',

          oliveTypeAr: params.oliveTypeAr,

          module: params.module,

          action: params.action,

          actorName: params.actorName,

          actorId: params.actorId,

          source: params.source,

          clientId: params.clientId,

          entryId: params.entryId,

          oliveType: params.oliveType,

          ...params.payload,

        },

      },

    });



    this.realtime.emit({

      entity: REALTIME_ENTITIES.NOTIFICATION,

      entityId: notification.id,

      action: params.action,

      module: params.module,

      seasonId: params.seasonId,

      oliveType: params.oliveType,

      clientId: params.clientId,

      entryId: params.entryId,

      clientName: params.clientName ?? '—',

      oliveTypeAr: params.oliveTypeAr,

      actorId: params.actorId,

      actorName: params.actorName,

      source: params.source,

      notification: {

        id: notification.id,

        type: notification.type,

        title: notification.title,

        message: notification.message,

        read: notification.read,

        createdAt: notification.createdAt.toISOString(),

        seasonId: notification.seasonId,

        payload: notification.payload as Record<string, unknown> | null,

      },

    });



    return notification;

  }



  async notifyMobileIntake(params: {

    clientName: string;

    oliveTypeAr: string;

    oliveType: string;

    weightKg: number;

    actorName: string;

    actorId: string;

    seasonId: string;

    clientId: string;

    entryId: string;

    isNewClient: boolean;

  }) {

    const weight = `${formatNum(params.weightKg)} كغ`;

    const message = params.isNewClient

      ? `زبون جديد من التطبيق المحمول : ${params.clientName} — ${params.oliveTypeAr} — ${weight} — أضافه ${params.actorName}`

      : `وزنة جديدة من التطبيق المحمول : ${params.clientName} — ${params.oliveTypeAr} — ${weight} — أضافها ${params.actorName}`;



    return this.createAndBroadcast({

      type: params.isNewClient

        ? NOTIFICATION_TYPES.MOBILE_CLIENT_INTAKE

        : NOTIFICATION_TYPES.MOBILE_WEIGHING,

      title: params.isNewClient ? 'زبون جديد (موبايل)' : 'وزنة جديدة (موبايل)',

      message,

      seasonId: params.seasonId,

      module: AUDIT_MODULES.OLIVE,

      action: params.isNewClient ? AUDIT_ACTIONS.CREATE : AUDIT_ACTIONS.CREATE,

      clientName: params.clientName,

      oliveTypeAr: params.oliveTypeAr,

      oliveType: params.oliveType,

      actorName: params.actorName,

      actorId: params.actorId,

      source: 'mobile',

      clientId: params.clientId,

      entryId: params.entryId,

      payload: {

        weightKg: params.weightKg,

        isNewClient: params.isNewClient,

      },

    });

  }



  async notifyMobileClientUpdate(params: {

    clientName: string;

    actorName: string;

    actorId: string;

    seasonId: string;

    clientId: string;

    summary: string;

  }) {

    const message = `تعديل زبون من التطبيق المحمول : ${params.clientName} — ${params.summary} — عدّله ${params.actorName}`;

    return this.createAndBroadcast({

      type: NOTIFICATION_TYPES.MOBILE_CLIENT_UPDATE,

      title: 'تعديل زبون (موبايل)',

      message,

      seasonId: params.seasonId,

      module: AUDIT_MODULES.CLIENTS,

      action: AUDIT_ACTIONS.UPDATE,

      clientName: params.clientName,

      actorName: params.actorName,

      actorId: params.actorId,

      source: 'mobile',

      clientId: params.clientId,

      payload: { summary: params.summary },

    });

  }



  async notifyWebClient(params: {

    action: 'CREATE' | 'UPDATE' | 'DELETE';

    clientName: string;

    actorName: string;

    actorId: string;

    seasonId: string;

    clientId: string;

  }) {

    const actionAr =

      params.action === 'CREATE'

        ? 'إضافة'

        : params.action === 'UPDATE'

          ? 'تعديل'

          : 'حذف';

    const message = `${actionAr} زبون من الويب : ${params.clientName} — ${params.actorName}`;

    return this.createAndBroadcast({

      type:

        params.action === 'CREATE'

          ? NOTIFICATION_TYPES.WEB_CLIENT_CREATE

          : NOTIFICATION_TYPES.WEB_CLIENT_UPDATE,

      title: `زبون — ${actionAr} (ويب)`,

      message,

      seasonId: params.seasonId,

      module: AUDIT_MODULES.CLIENTS,

      action: params.action,

      clientName: params.clientName,

      actorName: params.actorName,

      actorId: params.actorId,

      source: 'web',

      clientId: params.clientId,

    });

  }



  async notifyWebOliveEntry(params: {

    action: string;

    clientName: string;

    oliveTypeAr: string;

    oliveType: string;

    actorName: string;

    actorId: string;

    seasonId: string;

    clientId: string;

    entryId: string;

    summary: string;

  }) {

    const message = `${params.summary} — ${params.clientName} — ${params.oliveTypeAr} — ${params.actorName}`;

    return this.createAndBroadcast({

      type: NOTIFICATION_TYPES.WEB_OLIVE_ENTRY,

      title: 'استقبال زيتون (ويب)',

      message,

      seasonId: params.seasonId,

      module: AUDIT_MODULES.OLIVE,

      action: params.action,

      clientName: params.clientName,

      oliveTypeAr: params.oliveTypeAr,

      oliveType: params.oliveType,

      actorName: params.actorName,

      actorId: params.actorId,

      source: 'web',

      clientId: params.clientId,

      entryId: params.entryId,

      payload: { summary: params.summary },

    });

  }



  async notifyWebProcessing(params: {

    action: string;

    clientName: string;

    oliveTypeAr?: string;

    oliveType?: string;

    actorName: string;

    actorId: string;

    seasonId: string;

    clientId?: string;

    entryId?: string;

    summary: string;

    module: string;

  }) {

    const message = `${params.summary} — ${params.clientName} — ${params.actorName}`;

    const isPressing = params.module === AUDIT_MODULES.PRESSING;

    return this.createAndBroadcast({

      type: isPressing
        ? NOTIFICATION_TYPES.WEB_PRESSING
        : NOTIFICATION_TYPES.WEB_PROCESSING,

      title: isPressing ? 'عصر / استخراج (ويب)' : 'معالجة (ويب)',

      message,

      seasonId: params.seasonId,

      module: params.module,

      action: params.action,

      clientName: params.clientName,

      oliveTypeAr: params.oliveTypeAr,

      oliveType: params.oliveType,

      actorName: params.actorName,

      actorId: params.actorId,

      source: 'web',

      clientId: params.clientId,

      entryId: params.entryId,

      payload: { summary: params.summary },

    });

  }

  async notifyNewSeason(params: {
    seasonName: string;
    actorName: string;
    actorId: string;
    seasonId: string;
  }) {
    const message = `موسم جديد : ${params.seasonName} — بدأه ${params.actorName}`;
    return this.createAndBroadcast({
      type: NOTIFICATION_TYPES.WEB_SEASON_NEW,
      title: 'موسم جديد',
      message,
      seasonId: params.seasonId,
      module: AUDIT_MODULES.SEASONS,
      action: AUDIT_ACTIONS.NEW_SEASON,
      clientName: params.seasonName,
      actorName: params.actorName,
      actorId: params.actorId,
      source: 'web',
      payload: { seasonName: params.seasonName },
    });
  }

  /** Notification critique configurable (admin / système). */
  async notifyCritical(params: {
    title: string;
    message: string;
    seasonId: string;
    module: string;
    action: string;
    actorName: string;
    actorId?: string;
    clientName?: string;
    payload?: Record<string, unknown>;
  }) {
    return this.createAndBroadcast({
      type: NOTIFICATION_TYPES.SYSTEM_CRITICAL,
      title: params.title,
      message: params.message,
      seasonId: params.seasonId,
      module: params.module,
      action: params.action,
      clientName: params.clientName,
      actorName: params.actorName,
      actorId: params.actorId,
      source: 'web',
      payload: params.payload,
    });
  }

}


