export type AuthUser = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  roleAr: string;
  permissions: string[];
};

export type ClientBoardRow = {
  clientId: string;
  clientNumber: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  notes?: string | null;
  bagCount: number;
  totalWeightKg: number;
  adhlefCount: number;
  capacity: number;
  entryCount: number;
  latestEntryId: string | null;
  lastEntryDate?: string;
  lastReferenceNumber?: number;
};

export type WeighingEntry = {
  id: string;
  referenceNumber: number;
  entryDate: string;
  entryTime: string;
  bagCount: number;
  adhlefCount: number;
  capacity: number | null;
  totalWeightKg: number;
  user?: { username: string; firstName?: string | null };
};

export type Paginated<T> = {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};
