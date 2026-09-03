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
};

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';
