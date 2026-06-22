import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-development-only';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const isProduction = () => process.env.NODE_ENV === 'production';

const authCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, fiatBalance: 0.0 },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, authCookieOptions());

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, authCookieOptions());

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.cookie('token', '', { ...authCookieOptions(), maxAge: -1 });
  return res.json({ success: true });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found', authenticated: false });
    }
    return res.json({ authenticated: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    return res.status(500).json({ authenticated: false });
  }
});

// Google OAuth implementation
router.get('/google', (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.redirect(`${FRONTEND_URL}?error=NoCode`);
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error);

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const userData = await userResponse.json();

    let user = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          fiatBalance: 10000,
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, authCookieOptions());

    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.searchParams.set('token', token);
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.redirect(`${FRONTEND_URL}?error=GoogleAuthFailed`);
  }
});

router.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
    });

    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing password fields' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Cannot change password for this account type' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
