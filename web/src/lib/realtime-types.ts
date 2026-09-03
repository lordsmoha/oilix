export type RealtimeNotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  seasonId?: string | null;
  payload?: Record<string, unknown> | null;
};

export type RealtimeSyncPayload = {
  eventId: string;
  timestamp: string;
  entity: string;
  entityId?: string;
  action: string;
  module: string;
  seasonId?: string;
  oliveType?: string;
  clientId?: string;
  entryId?: string;
  clientName?: string;
  oliveTypeAr?: string;
  actorId?: string;
  actorName?: string;
  source?: 'web' | 'mobile';
  updatedAt?: string;
  notification?: RealtimeNotificationPayload;
};

export type RealtimeConflictPayload = {
  eventId: string;
  timestamp: string;
  entity: string;
  entityId: string;
  serverUpdatedAt: string;
  message: string;
};

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';
