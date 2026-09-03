import { ConflictException } from '@nestjs/common';

export function assertNotStale(
  serverUpdatedAt: Date,
  expectedUpdatedAt?: string,
): void {
  if (!expectedUpdatedAt) return;

  const expected = new Date(expectedUpdatedAt).getTime();
  const server = serverUpdatedAt.getTime();
  if (Number.isNaN(expected)) return;

  if (server > expected) {
    throw new ConflictException({
      message:
        'تم تعديل السجل من مستخدم آخر. يرجى تحديث البيانات وإعادة المحاولة.',
      code: 'STALE_UPDATE',
      serverUpdatedAt: serverUpdatedAt.toISOString(),
    });
  }
}
