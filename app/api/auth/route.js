// app/api/auth/route.js
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { signToken, verifyToken } from '@/lib/auth/jwt';
import { hashPassword, comparePassword } from '@/lib/auth/password';

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }));
}

function json(data, status = 200) {
  return cors(NextResponse.json(data, { status }));
}

async function handleAuth(request) {
  const method = request.method;

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/auth', '');

    // POST /api/auth/signup
    if ((path === '/' || path === '' || path === '/signup') && method === 'POST') {
      const body = await request.json();
      const { email, password, name, grade, avatar } = body;

      // Validate required fields
      if (!email || !password || !name || !grade) {
        return json({ error: 'email, password, name, and grade are required' }, 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return json({ error: 'Invalid email format' }, 400);
      }

      // Validate password length
      if (password.length < 6) {
        return json({ error: 'Password must be at least 6 characters' }, 400);
      }

      // Check for duplicate email
      const existing = db.users.getByEmail(email.toLowerCase().trim());
      if (existing) {
        return json({ error: 'An account with this email already exists' }, 409);
      }

      // Hash password and create user
      const password_hash = await hashPassword(password);
      const user = {
        id: uuidv4(),
        name: String(name).slice(0, 24),
        email: email.toLowerCase().trim(),
        grade: Number(grade),
        avatar: avatar || '🦊',
        password_hash,
        totalCoins: 0,
        currentStreak: 0,
        lastPlayed: null,
        createdAt: new Date(),
      };

      db.users.create(user);

      // Sign JWT
      const token = await signToken({ userId: user.id, email: user.email });

      // Return user without password_hash
      const { password_hash: _, ...safeUser } = user;
      return json({ user: safeUser, token, progress: [] }, 201);
    }

    // POST /api/auth/login
    if ((path === '/login') && method === 'POST') {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return json({ error: 'Email and password are required' }, 400);
      }

      // Find user by email
      const user = db.users.getByEmail(email.toLowerCase().trim());
      if (!user) {
        return json({ error: 'Invalid email or password' }, 401);
      }

      // Verify password
      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return json({ error: 'Invalid email or password' }, 401);
      }

      // Sign JWT
      const token = await signToken({ userId: user.id, email: user.email });

      // Return user without password_hash
      const { password_hash: _, ...safeUser } = user;
      const progress = db.progress.getById(user.id);
      return json({ user: safeUser, token, progress });
    }

    // GET /api/auth/me
    if ((path === '/me') && method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return json({ error: 'Missing or invalid Authorization header' }, 401);
      }

      let payload;
      try {
        payload = await verifyToken(authHeader.slice(7));
      } catch {
        return json({ error: 'Invalid or expired token' }, 401);
      }

      const userId = payload.userId || payload.sub;
      const user = db.users.getById(userId);
      if (!user) {
        return json({ error: 'User not found' }, 404);
      }

      const progress = db.progress.getById(userId);
      return json({ user, progress });
    }

    return json({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('Auth API Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export const GET = handleAuth;
export const POST = handleAuth;
export const PUT = handleAuth;
export const DELETE = handleAuth;
export const PATCH = handleAuth;
