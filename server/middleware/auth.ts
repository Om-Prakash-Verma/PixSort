import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isGuest?: boolean;
}

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

function getFirebaseProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  try {
    const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      if (parsed.projectId) return parsed.projectId;
    }
  } catch {
    // ignore
  }
  return 'pixsort-62b7b';
}

async function fetchGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certsExpiresAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public certs: ${res.status}`);
  }
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600 * 1000;
  cachedCerts = (await res.json()) as Record<string, string>;
  certsExpiresAt = now + maxAgeMs;
  return cachedCerts;
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

export interface VerifiedTokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  email?: string;
}

/**
 * Cryptographically verifies a Firebase Auth ID token (RS256) against Google's public certificates.
 */
export async function verifyFirebaseIdToken(
  token: string,
  certsOverride?: Record<string, string>,
  projectIdOverride?: string
): Promise<VerifiedTokenPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT');
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf-8')) as {
    alg?: string;
    kid?: string;
  };
  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Invalid JWT header');
  }

  const certs = certsOverride || (await fetchGoogleCerts());
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Unknown signing key');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(sigB64);
  if (!verifier.verify(cert, signature)) {
    throw new Error('Invalid JWT signature');
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8')) as VerifiedTokenPayload;
  const projectId = projectIdOverride || getFirebaseProjectId();
  const nowSec = Math.floor(Date.now() / 1000);

  if (payload.aud !== projectId) {
    throw new Error('Invalid token audience');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Invalid token issuer');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Missing token subject');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Token expired');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Token issued in the future');
  }

  return payload;
}

const GUEST_ID_PATTERN = /^guest_[a-zA-Z0-9]{4,32}$/;

/**
 * Express middleware that requires either a verified Firebase Bearer ID token
 * or a valid ephemeral guest session ID (`guest_*`). Never trusts raw `x-user-id` for real accounts.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({ error: 'Missing Bearer token' });
      return;
    }
    try {
      const payload = await verifyFirebaseIdToken(token);
      req.userId = payload.sub;
      req.isGuest = false;
      next();
      return;
    } catch (err: any) {
      res.status(401).json({ error: 'Invalid or expired authentication token', detail: err.message });
      return;
    }
  }

  const guestHeader = req.headers['x-user-id'];
  if (typeof guestHeader === 'string' && GUEST_ID_PATTERN.test(guestHeader)) {
    req.userId = guestHeader;
    req.isGuest = true;
    next();
    return;
  }

  res.status(401).json({ error: 'Authentication required' });
}
