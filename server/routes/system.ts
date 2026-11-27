import { Router, Response } from 'express';
import { dbService } from '../services/database.js';
import { aiService } from '../services/ai.js';
import { vectorSearchService } from '../services/vectorSearch.js';
import { driveStorageService } from '../services/storage.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { SystemStatus } from '../../src/types.js';

export const systemRouter = Router();

systemRouter.use(requireAuth);

// System status (scoped to authenticated user)
systemRouter.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  await dbService.ensureUserHydrated(userId, req.idToken);
  const stats = dbService.getStats(userId);
  const pooled = driveStorageService.getPooledStats(userId);

  const status: SystemStatus = {
    geminiEmbeddingModel: 'gemini-embedding-2-preview',
    hasGeminiKey: aiService.getHasKey(),
    vertexVectorSearchReady: true,
    indexedVectorsCount: vectorSearchService.getIndexedCount(userId),
    totalPhotosCount: stats.total,
    readyPhotosCount: stats.ready,
    processingCount: stats.processing,
    favoritesCount: stats.favorites,
    trashCount: stats.trash,
    firestoreConnected: stats.firestoreConnected,
    firebaseProjectId: stats.firebaseProjectId,
    // Google Drive Pooled Storage
    googleDriveAccountsCount: pooled.accountsCount,
    googleDriveActiveCount: pooled.activeCount,
    googleDriveTotalStorage: pooled.totalStorage,
    googleDriveUsedStorage: pooled.usedStorage,
    googleDriveAvailableStorage: pooled.availableStorage,
    primaryDriveEmail: pooled.primaryAccountEmail,
    // Legacy compatibility fields
    cloudStorageItems: stats.total,
    cloudStorageConnected: pooled.activeCount > 0,
    cloudStorageBucket: pooled.primaryAccountEmail || 'Google Drive',
    cloudStorageProvisioned: true,
  };
  res.json(status);
});

// Clear current user's data (photos and albums)
systemRouter.post('/data/clear', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    vectorSearchService.clearUser(userId);
    await dbService.clearUserData(userId);
    res.json({ message: 'Your photos and albums have been removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

systemRouter.post('/demo/reset', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    vectorSearchService.clearUser(userId);
    await dbService.clearUserData(userId);
    res.json({ message: 'Your demo data has been removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
