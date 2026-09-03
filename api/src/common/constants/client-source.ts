export const CLIENT_SOURCE_HEADER = 'x-client-source';

export const CLIENT_SOURCES = {
  WEB: 'web',
  MOBILE: 'mobile',
} as const;

export type ClientSource = (typeof CLIENT_SOURCES)[keyof typeof CLIENT_SOURCES];

export function parseClientSource(header?: string): ClientSource {
  return header?.toLowerCase() === CLIENT_SOURCES.MOBILE
    ? CLIENT_SOURCES.MOBILE
    : CLIENT_SOURCES.WEB;
}
