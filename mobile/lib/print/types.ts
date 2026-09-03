/** Types des bons / cartes thermiques (alignés API reports). */

export type OliveTypePrintInfo = {
  oliveType: 'GREEN' | 'ZBOUCH' | 'RIPE' | string;
  labelFr?: string;
  labelAr?: string;
  display?: string;
};

export type ClientCardPrintData = {
  kind: 'card';
  seasonName: string | null;
  entryCount: number;
  oliveType: OliveTypePrintInfo;
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  bags: number;
  weightKg: number;
  adhlef: number;
  capacity: number;
};

export type ClientReceiptPrintData = {
  kind: 'receipt';
  company: { name: string; pricePerQuintal: number };
  seasonName: string | null;
  printedAt: string;
  oliveTypes: OliveTypePrintInfo[];
  client: {
    clientNumber: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  weighing: {
    entryCount: number;
    totalBags: number;
    totalWeightKg: number;
    totalAdhlef: number;
    totalCapacity: number;
  };
  financial: { totalAmount: number };
  /** Informations opérateurs (mobile) */
  printedBy?: string | null;
};

export type PrintDocument = ClientCardPrintData | ClientReceiptPrintData;

export type PrintHistoryItem = {
  id: string;
  createdAt: string;
  title: string;
  subtitle: string;
  docKind: 'card' | 'receipt';
  clientId: string;
  oliveType: string;
  document: PrintDocument;
};
