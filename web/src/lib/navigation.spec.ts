import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isNavActive, type NavMatchable } from './nav-active.ts';

const millItems: NavMatchable[] = [
  { href: '/dashboard', match: ['/dashboard'] },
  { href: '/olive/green', match: ['/olive/green'] },
  { href: '/olive/green/processing', match: ['/olive/green/processing'] },
  { href: '/olive/zbouch', match: ['/olive/zbouch'] },
  { href: '/olive/zbouch/processing', match: ['/olive/zbouch/processing'] },
  { href: '/settings', match: ['/settings'] },
  { href: '/settings/devices', match: ['/settings/devices'] },
];

function activeHrefs(pathname: string) {
  return millItems
    .filter((item) => isNavActive(pathname, item, millItems))
    .map((item) => item.href);
}

describe('sidebar active path matching', () => {
  it('highlights only معالجة when on a processing page', () => {
    assert.deepEqual(activeHrefs('/olive/zbouch/processing'), [
      '/olive/zbouch/processing',
    ]);
  });

  it('highlights only استقبال on the reception page', () => {
    assert.deepEqual(activeHrefs('/olive/zbouch'), ['/olive/zbouch']);
  });

  it('does not mark /settings active on /settings/devices', () => {
    assert.deepEqual(activeHrefs('/settings/devices'), ['/settings/devices']);
  });
});
