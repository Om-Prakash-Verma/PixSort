import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { UPLOADS_DIR } from '../config.js';
import { dbService } from '../services/database.js';

export const mediaRouter = Router();

mediaRouter.get('/:file', async (req: Request, res: Response) => {
  const filename = req.params.file;
  const localFilePath = path.join(UPLOADS_DIR, filename);

  // 1. If file already exists locally on disk, serve it immediately
  if (fs.existsSync(localFilePath)) {
    return res.sendFile(localFilePath);
  }

  // 2. If it is an Unsplash sample photo (e.g. photo-1464863979621-258859e62245.avif)
  const allPhotos = await dbService.getPhotos();
  const photo = allPhotos.find(
    (p) => p.url?.includes(filename) || p.thumbnailUrl?.includes(filename) || p.id === filename.replace(/\.[^/.]+$/, '')
  );
  const candidateName = (photo?.filename || '') + ' ' + filename;
  const unsplashMatch = candidateName.match(/photo-\d+-[a-zA-Z0-9]+/);

  if (unsplashMatch) {
    const unsplashUrl = `https://images.unsplash.com/${unsplashMatch[0]}?auto=format&fit=crop&w=1200&q=80`;
    try {
      const remoteRes = await fetch(unsplashUrl);
      if (remoteRes.ok) {
        const arrayBuf = await remoteRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        // Cache locally so subsequent requests never have to re-fetch
        fs.writeFileSync(localFilePath, buffer);
        res.setHeader('Content-Type', remoteRes.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    } catch (fetchErr) {
      console.warn('[Storage] Remote sample fetch failed, using fallback card:', fetchErr);
    }
  }

  // 3. Graceful SVG fallback card for cloud-synced photos not present on local disk
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(`
    <svg width="600" height="450" viewBox="0 0 600 450" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="450" rx="16" fill="#E2E8F0"/>
      <circle cx="300" cy="180" r="44" fill="#CBD5E1"/>
      <path d="M282 170C282 166.686 284.686 164 288 164H312C315.314 164 318 166.686 318 170V194C318 197.314 315.314 200 312 200H288C284.686 200 282 197.314 282 194V170Z" stroke="#64748B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="293" cy="175" r="2.5" fill="#64748B"/>
      <path d="M285 195L293 184L301 191L306 186L314 195" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="300" y="260" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="15" fill="#334155" text-anchor="middle">Synced From Cloud</text>
      <text x="300" y="285" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Photo metadata & vectors indexed from Cloud Firestore</text>
      <text x="300" y="315" font-family="monospace" font-size="11" fill="#94A3B8" text-anchor="middle">${filename}</text>
    </svg>
  `);
});
