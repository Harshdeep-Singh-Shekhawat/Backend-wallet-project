import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const url = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('x-forwarded-proto') === 'https' ? `https://${request.headers.get('host')}` : url.origin);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'OAuth configuration missing' }, { status: 500 });
  }

  const scope = encodeURIComponent('email profile openid');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
