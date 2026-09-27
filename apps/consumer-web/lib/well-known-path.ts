/** F.6 — root association files must never receive F.5 locale prefix redirects. */
export function isWellKnownAssociationPath(pathname: string): boolean {
  if (pathname === '/.well-known') return true;
  return pathname.startsWith('/.well-known/');
}
