import {
  appleAppSiteAssociationResponse,
  WELL_KNOWN_JSON_CONTENT_TYPE,
} from '@/lib/well-known-response';

export const dynamic = 'force-static';

export function GET() {
  const { status, body } = appleAppSiteAssociationResponse();
  return new Response(body, {
    status,
    headers: {
      'Content-Type': WELL_KNOWN_JSON_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
