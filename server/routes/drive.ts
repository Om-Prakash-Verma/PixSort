import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { driveStorageService } from '../services/driveStorage.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

export const driveRouter = Router();

// Short-lived CSRF state store for OAuth 2.0 flows
const pendingOAuthStates = new Map<string, { userId: string; redirectUri: string; expiresAt: number }>();

function getGoogleClientId(): string {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.oAuthClientId) return config.oAuthClientId;
    }
  } catch {
    // ignore
  }
  return '857140496927-1lj806cl8f9u4flrtov66fi25em4b5um.apps.googleusercontent.com';
}

/**
 * GET /api/drive/config
 * Public client configuration for Firebase Auth popup
 */
driveRouter.get('/config', (req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return res.json({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        appId: config.appId,
        oAuthClientId: config.oAuthClientId,
      });
    }
  } catch (err) {
    console.warn('[Drive Config] Warning reading config:', err);
  }
  res.status(404).json({ error: 'Config not available' });
});

/**
 * GET /api/drive/oauth/callback
 * Handles OAuth 2.0 code exchange callback with CSRF state verification
 */
driveRouter.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    return res.status(400).send('OAuth authorization code or state missing.');
  }

  const stateEntry = pendingOAuthStates.get(state);
  pendingOAuthStates.delete(state);
  if (!stateEntry || stateEntry.expiresAt < Date.now()) {
    return res.status(403).send('Invalid or expired OAuth state.');
  }

  try {
    const clientId = getGoogleClientId();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    if (clientSecret) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: stateEntry.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (userRes.ok) {
          const userInfo = await userRes.json();
          await driveStorageService.connectAccount({
            userId: stateEntry.userId,
            googleAccountEmail: userInfo.email,
            googleAccountId: userInfo.id,
            credentials: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
            },
          });
        }
      }
    }

    res.redirect('/?tab=storage&connected=true');
  } catch (err) {
    console.error('[OAuth Callback Error]', err);
    res.redirect('/?tab=storage&error=oauth_failed');
  }
});

// All remaining Drive endpoints require authentication
driveRouter.use(requireAuth);

/**
 * GET /api/drive/accounts
 */
driveRouter.get('/accounts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const accounts = await driveStorageService.getAccounts(userId);
    const pooledStats = driveStorageService.getPooledStats(userId);
    res.json({
      accounts,
      stats: pooledStats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drive/oauth/url
 */
driveRouter.get('/oauth/url', (req: AuthenticatedRequest, res: Response) => {
  const clientId = getGoogleClientId();
  const defaultRedirect = `${req.protocol}://${req.get('host')}/api/drive/oauth/callback`;
  const requestedRedirect = req.query.redirectUri as string | undefined;

  // Only allow same-host redirectUri to prevent open redirect / token theft
  let redirectUri = defaultRedirect;
  if (requestedRedirect) {
    try {
      const parsed = new URL(requestedRedirect);
      if (parsed.host === req.get('host')) {
        redirectUri = requestedRedirect;
      }
    } catch {
      // keep defaultRedirect
    }
  }

  const state = crypto.randomBytes(24).toString('hex');
  pendingOAuthStates.set(state, {
    userId: req.userId!,
    redirectUri,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    }).toString();

  res.json({
    url: authUrl,
    clientId,
    redirectUri,
  });
});

/**
 * POST /api/drive/accounts/connect
 */
driveRouter.post('/accounts/connect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, storageLimitGb, storageUsedGb, accessToken, refreshToken } = req.body;
    const userId = req.userId!;
    if (!email) {
      return res.status(400).json({ error: 'Google account email is required' });
    }

    const limit = storageLimitGb ? storageLimitGb * 1024 * 1024 * 1024 : 15 * 1024 * 1024 * 1024;
    const used =
      storageUsedGb !== undefined ? storageUsedGb * 1024 * 1024 * 1024 : Math.round(1.5 * 1024 * 1024 * 1024);

    const account = await driveStorageService.connectAccount({
      userId,
      googleAccountEmail: email,
      storageLimit: limit,
      storageUsed: used,
      credentials: accessToken
        ? {
            accessToken,
            refreshToken,
          }
        : undefined,
    });

    res.json({
      message: `Google Drive account ${email} connected successfully.`,
      account,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drive/accounts/priority
 */
driveRouter.post('/accounts/priority', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountIds } = req.body;
    if (!Array.isArray(accountIds)) {
      return res.status(400).json({ error: 'accountIds array is required' });
    }

    const reordered = await driveStorageService.reorderAccounts(accountIds, req.userId!);
    res.json({
      message: 'Account priority updated.',
      accounts: reordered,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drive/accounts/:id/disconnect
 */
driveRouter.post('/accounts/:id/disconnect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = driveStorageService.getAccountById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Drive account not found.' });
    }
    await driveStorageService.disconnectAccount(req.params.id);
    res.json({
      success: true,
      message: 'Account disconnected. Your photos remain safe in your Google Drive account.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/drive/accounts/:id
 */
driveRouter.delete('/accounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = driveStorageService.getAccountById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Drive account not found.' });
    }
    await driveStorageService.deleteAccount(req.params.id);
    res.json({
      success: true,
      message: 'Google Drive storage account removed.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drive/accounts/:id/reconnect
 */
driveRouter.post('/accounts/:id/reconnect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = driveStorageService.getAccountById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Drive account not found.' });
    }
    await driveStorageService.reconnectAccount(req.params.id);
    res.json({
      success: true,
      message: 'Google Drive account reconnected.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drive/accounts/:id/stats
 */
driveRouter.get('/accounts/:id/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = driveStorageService.getAccountById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    await driveStorageService.refreshQuotaFromDrive(req.params.id);
    const acc = driveStorageService.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found.' });
    res.json(acc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
