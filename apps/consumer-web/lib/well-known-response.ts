import {
  buildAppleAppSiteAssociation,
  buildAssetLinksJson,
} from './app-association-config';

export const WELL_KNOWN_JSON_CONTENT_TYPE = 'application/json';

export function assetLinksResponseBody(env: NodeJS.ProcessEnv = process.env): string {
  return JSON.stringify(buildAssetLinksJson(env));
}

export function appleAppSiteAssociationResponse(
  env: NodeJS.ProcessEnv = process.env,
): { status: 200 | 404; body: string } {
  const aasa = buildAppleAppSiteAssociation(env);
  if (!aasa) {
    return {
      status: 404,
      body: JSON.stringify({
        applinks: { apps: [], details: [] },
      }),
    };
  }
  return { status: 200, body: JSON.stringify(aasa) };
}
