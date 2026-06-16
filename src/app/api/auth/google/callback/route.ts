import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('Google OAuth Error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('x-forwarded-proto') === 'https' ? `https://${request.headers.get('host')}` : url.origin);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Missing OAuth configuration' }, { status: 500 });
  }

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(`Failed to fetch access token: ${tokenData.error_description || tokenData.error}`);
    }

    const { access_token } = tokenData;

    // 2. Fetch user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }

    const { email, name } = userData;

    if (!email) {
      throw new Error('Google did not return an email address');
    }

    // 3. Find or Create User
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          // password is null/optional
        },
      });
    }

    // 4. Create Session
    const sessionData = { userId: user.id, email: user.email, name: user.name };
    const sessionToken = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // 5. Redirect to Dashboard
    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_exception', request.url));
  }
}
