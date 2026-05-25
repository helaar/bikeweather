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

    const data = await stravaRes.json();

    return Response.json(data, {
      status: stravaRes.status,
      headers: { 'Access-Control-Allow-Origin': 'https://helaar.github.io' },
    });
  },
};
