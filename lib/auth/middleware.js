// lib/auth/middleware.js
import { verifyToken } from './jwt.js';

export async function authenticateRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid Authorization header' };
  }
  try {
    const payload = await verifyToken(authHeader.slice(7));
    return { userId: payload.userId || payload.sub, error: null };
  } catch {
    return { userId: null, error: 'Invalid or expired token' };
  }
}
