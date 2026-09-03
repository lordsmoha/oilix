export const REALTIME_EVENTS = {
  SYNC: 'sync',
  CONFLICT: 'conflict',
} as const;

export const REALTIME_ENTITIES = {
  CLIENT: 'client',
  OLIVE_ENTRY: 'olive_entry',
  PROCESSING: 'processing',
  PRESSING: 'pressing',
  FILTRATION: 'filtration',
  NOTIFICATION: 'notification',
  OIL_SALE: 'oil_sale',
  OIL_STOCK: 'oil_stock',
  CONTAINER_STOCK: 'container_stock',
  CASH_SESSION: 'cash_session',
  DEVICE: 'device',
} as const;

export type RealtimeEntity =
  (typeof REALTIME_ENTITIES)[keyof typeof REALTIME_ENTITIES];
