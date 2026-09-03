export type NavMatchable = {
  href: string;
  match?: string[];
};

export function pathMatchesNav(pathname: string, prefix: string): boolean {
  if (!prefix) return false;
  return pathname === prefix || (prefix !== '/' && pathname.startsWith(`${prefix}/`));
}

function longestMatch(pathname: string, item: NavMatchable): number {
  const paths = item.match ?? [item.href];
  let best = 0;
  for (const p of paths) {
    if (pathMatchesNav(pathname, p) && p.length > best) best = p.length;
  }
  return best;
}

/**
 * A nav item is active only if it matches, AND no sibling item has a longer matching prefix.
 * Prevents `/olive/zbouch` from highlighting alongside `/olive/zbouch/processing`.
 */
export function isNavActive(
  pathname: string,
  item: NavMatchable,
  siblings: NavMatchable[] = [],
): boolean {
  const own = longestMatch(pathname, item);
  if (!own) return false;
  if (!siblings.length) return true;
  return siblings.every((other) => other === item || longestMatch(pathname, other) <= own);
}
