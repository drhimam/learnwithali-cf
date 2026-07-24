// lib/auth/jwt.js
import { SignJWT, jwtVerify } from 'jose';

function getSecret() {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
  return new TextEncoder().encode(secret);
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}
