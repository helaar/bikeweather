interface Env {
  STRAVA_CLIENT_SECRET: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://helaar.github.io',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json() as Record<string, string>;

    const params = new URLSearchParams({
      client_id: body.client_id,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: body.grant_type,
      ...(body.code && { code: body.code }),
      ...(body.refresh_token && { refresh_token: body.refresh_token }),
    });

    const stravaRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    // Pass the body through verbatim. Parsing and re-serializing with JSON.parse/
    // JSON.stringify would silently round 64-bit IDs (e.g. athlete.id) above 2^53.
    const data = await stravaRes.text();

    return new Response(data, {
      status: stravaRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://helaar.github.io',
      },
    });
  },
};
