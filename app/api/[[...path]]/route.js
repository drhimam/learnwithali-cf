export const runtime = 'edge'

import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { signToken, verifyToken } from '@/lib/auth/jwt'
import { hashPassword, comparePassword } from '@/lib/auth/password'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

async function getAuthUserId(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  try {
    const payload = await verifyToken(authHeader.slice(7))
    return payload.userId || payload.sub
  } catch {
    return null
  }
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await getDb();

    // Health check (public)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'LearnWithAli API', ok: true }))
    }

    // Create a kid profile - POST /api/profile (public - for signup flow)
    if (route === '/profile' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.grade) {
        return handleCORS(NextResponse.json({ error: 'name and grade are required' }, { status: 400 }))
      }
      const user = {
        id: uuidv4(),
        name: String(body.name).slice(0, 24),
        email: body.email || null,
        grade: Number(body.grade),
        avatar: body.avatar || '🦊',
        password_hash: body.password_hash || null,
        totalCoins: 0,
        currentStreak: 0,
        lastPlayed: null,
        createdAt: new Date(),
      }
      db.users.create(user)
      const { password_hash: _, ...safeUser } = user
      return handleCORS(NextResponse.json({ user: safeUser, progress: [] }))
    }

    // Get profile + progress - GET /api/profile/:id (requires auth)
    if (path[0] === 'profile' && path[1] && method === 'GET') {
      const authUserId = await getAuthUserId(request)
      if (!authUserId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      // Users can only fetch their own profile
      if (authUserId !== path[1]) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }
      const user = await db.users.getById(path[1])
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'profile not found' }, { status: 404 }))
      }
      const progress = await db.progress.getById(path[1])
      return handleCORS(NextResponse.json({ user, progress }))
    }

    // Complete a level - POST /api/complete-level (requires auth)
    if (route === '/complete-level' && method === 'POST') {
      const authUserId = await getAuthUserId(request)
      if (!authUserId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { userId, worldId, levelNumber, score, total, coinsEarned, stars, timeSec } = body
      if (!userId || !worldId || !levelNumber) {
        return handleCORS(NextResponse.json({ error: 'userId, worldId, levelNumber required' }, { status: 400 }))
      }

      // Verify the authenticated user matches the request
      if (authUserId !== userId) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const user = await db.users.getById(userId)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'profile not found' }, { status: 404 }))
      }

      // Streak logic
      const now = new Date()
      let streak = user.currentStreak || 0
      const last = user.lastPlayed ? new Date(user.lastPlayed) : null
      if (!last) {
        streak = 1
      } else if (sameDay(last, now)) {
        streak = streak || 1
      } else {
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        streak = sameDay(last, yesterday) ? streak + 1 : 1
      }

      const coins = Math.max(0, Number(coinsEarned) || 0)
      await db.users.updateCoinsStreak(userId, coins, streak, now)

      // Upsert progress, keeping the best score/stars
      const newStars = Number(stars) || 0
      const newScore = Number(score) || 0
      await db.progress.upsert({
        userId,
        worldId,
        levelNumber: Number(levelNumber),
        stars: newStars,
        bestScore: newScore,
        total: Number(total) || 0,
        coinsEarned: coins,
        plays: 1,
        completedAt: now,
        lastCompletedAt: now,
      })

      const updatedUser = await db.users.getById(userId)
      const progress = await db.progress.getById(userId)
      return handleCORS(NextResponse.json({ user: updatedUser, progress }))
    }

    // Leaderboard - GET /api/leaderboard (public - shows only names, avatars, coins)
    if (route === '/leaderboard' && method === 'GET') {
      const top = await db.leaderboard.getTop(10)
      return handleCORS(NextResponse.json({ leaderboard: top }))
    }

    // ---- Auth routes ----

    // POST /api/auth/signup
    if (path[0] === 'auth' && path[1] === 'signup' && method === 'POST') {
      const body = await request.json()
      const { email, password, name, grade, avatar } = body

      if (!email || !password || !name || !grade) {
        return handleCORS(NextResponse.json({ error: 'email, password, name, and grade are required' }, { status: 400 }))
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return handleCORS(NextResponse.json({ error: 'Invalid email format' }, { status: 400 }))
      }
      if (password.length < 6) {
        return handleCORS(NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 }))
      }

      const existing = await db.users.getByEmail(email.toLowerCase().trim())
      if (existing) {
        return handleCORS(NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 }))
      }

      const password_hash = await hashPassword(password)
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
      }

      await db.users.create(user)
      const token = await signToken({ userId: user.id, email: user.email })
      const { password_hash: _, ...safeUser } = user
      return handleCORS(NextResponse.json({ user: safeUser, token, progress: [] }, { status: 201 }))
    }

    // POST /api/auth/login
    if (path[0] === 'auth' && path[1] === 'login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password are required' }, { status: 400 }))
      }

      const user = await db.users.getByEmail(email.toLowerCase().trim())
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      }

      const valid = await comparePassword(password, user.password_hash)
      if (!valid) {
        return handleCORS(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
      }

      const token = await signToken({ userId: user.id, email: user.email })
      const { password_hash: _, ...safeUser } = user
      const progress = await db.progress.getById(user.id)
      return handleCORS(NextResponse.json({ user: safeUser, token, progress }))
    }

    // GET /api/auth/me
    if (path[0] === 'auth' && path[1] === 'me' && method === 'GET') {
      const authUserId = await getAuthUserId(request)
      if (!authUserId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const user = await db.users.getById(authUserId)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }
      const progress = await db.progress.getById(authUserId)
      return handleCORS(NextResponse.json({ user, progress }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
