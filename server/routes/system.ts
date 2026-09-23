import { Router, Request, Response } from 'express';
import { dbService } from '../services/database.js';
import { aiService } from '../services/ai.js';
import { vectorSearchService } from '../services/vectorSearch.js';
import { storageService } from '../services/storage.js';
import { SystemStatus } from '../../src/types.js';

export const systemRouter = Router();

// System status
systemRouter.get('/status', (req: Request, res: Response) => {
  const stats = dbService.getStats();
  const cloudStorageStatus = storageService.getCloudStatus();
  const status: SystemStatus = {
    geminiEmbeddingModel: 'gemini-embedding-2-preview',
    hasGeminiKey: aiService.getHasKey(),
    vertexVectorSearchReady: true,
    indexedVectorsCount: vectorSearchService.getIndexedCount(),
    totalPhotosCount: stats.total,
    readyPhotosCount: stats.ready,
    processingCount: stats.processing,
    cloudStorageItems: storageService.getItemCount() + stats.total,
    cloudStorageConnected: cloudStorageStatus.isConnected,
    cloudStorageBucket: cloudStorageStatus.bucketName,
    cloudStorageProvisioned: cloudStorageStatus.isProvisioned,
    firestoreConnected: stats.firestoreConnected,
    firebaseProjectId: stats.firebaseProjectId,
  };
  res.json(status);
});

// Clear all data (photos and albums)
systemRouter.post('/data/clear', async (req: Request, res: Response) => {
  try {
    vectorSearchService.clear();
    await dbService.clearAllData();
    res.json({ message: 'All photos and albums have been removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

systemRouter.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    vectorSearchService.clear();
    await dbService.clearAllData();
    res.json({ message: 'All demo data removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
