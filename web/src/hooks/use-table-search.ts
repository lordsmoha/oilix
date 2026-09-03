'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type ClientSearchQuery = {
  ref?: string;
  name?: string;
  phone?: string;
};

export function hasClientSearchQuery(q: ClientSearchQuery): boolean {
  return !!(q.ref?.trim() || q.name?.trim() || q.phone?.trim());
}

export function clientMatchesSearch(
  row: {
    clientNumber?: number;
    clientName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    referenceNumber?: number;
  },
  q: ClientSearchQuery,
): boolean {
  const ref = q.ref?.trim();
  const name = q.name?.trim().toLowerCase();
  const phone = q.phone?.trim().replace(/\s/g, '');
  if (!ref && !name && !phone) return false;

  const fullName = (
    row.clientName ?? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()
  ).toLowerCase();

  if (ref) {
    const refStr = String(row.clientNumber ?? row.referenceNumber ?? '');
    if (!refStr.includes(ref)) return false;
  }
  if (name && !fullName.includes(name)) return false;
  if (phone) {
    const rowPhone = (row.phone ?? '').replace(/\s/g, '');
    if (!rowPhone.includes(phone)) return false;
  }
  return true;
}

export function scrollTableRowIntoView(rowId: string) {
  requestAnimationFrame(() => {
    document.getElementById(`table-row-${rowId}`)?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  });
}

export function useTableSearchNav<T>(
  rows: T[],
  getRowId: (row: T) => string,
  matchRow: (row: T) => boolean,
  active: boolean,
) {
  const matchingIds = useMemo(
    () => (active ? rows.filter(matchRow).map(getRowId) : []),
    [rows, matchRow, getRowId, active],
  );

  const [matchIndex, setMatchIndex] = useState(0);

  useEffect(() => {
    setMatchIndex(0);
  }, [matchingIds.join('|')]);

  const currentMatchId = matchingIds[matchIndex] ?? null;

  useEffect(() => {
    if (currentMatchId) scrollTableRowIntoView(currentMatchId);
  }, [currentMatchId]);

  const goNext = useCallback(() => {
    if (matchingIds.length === 0) return;
    setMatchIndex((i) => (i + 1) % matchingIds.length);
  }, [matchingIds.length]);

  const goPrev = useCallback(() => {
    if (matchingIds.length === 0) return;
    setMatchIndex((i) => (i - 1 + matchingIds.length) % matchingIds.length);
  }, [matchingIds.length]);

  const goFirst = useCallback(() => {
    if (matchingIds.length === 0) return null;
    setMatchIndex(0);
    return matchingIds[0] ?? null;
  }, [matchingIds]);

  return {
    matchingIds,
    matchIndex,
    matchCount: matchingIds.length,
    currentMatchId,
    goNext,
    goPrev,
    goFirst,
  };
}
