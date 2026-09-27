import { assetLinksResponseBody, WELL_KNOWN_JSON_CONTENT_TYPE } from '@/lib/well-known-response';

export const dynamic = 'force-static';

export function GET() {
  return new Response(assetLinksResponseBody(), {
    status: 200,
    headers: {
      'Content-Type': WELL_KNOWN_JSON_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
