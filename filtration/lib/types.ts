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
