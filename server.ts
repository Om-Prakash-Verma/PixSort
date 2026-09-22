import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { dbService } from './server/services/database.js';
import { storageService } from './server/services/storage.js';
import { vectorSearchService } from './server/services/vectorSearch.js';
import { aiService } from './server/services/ai.js';
import { Photo, SearchResponse, SystemStatus } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function bootstrapVectorIndex() {
  console.log('[System] Initializing Vertex AI Vector Search index from Firestore metadata...');
  const photos = await dbService.getPhotos('user_default', { isTrash: false });

  for (const photo of photos) {
    const textContext = `${photo.aiDescription} ${photo.objects.join(' ')} ${photo.activities.join(' ')} ${photo.environment} ${photo.time} ${photo.location}`;
    const vector = await aiService.embedText(textContext);

    await vectorSearchService.upsertVector({
      id: photo.id,
      userId: photo.userId,
      vector,
      metadata: {
        dateTaken: photo.dateTaken,
        location: photo.location,
        isFavorite: photo.isFavorite,
        albumIds: photo.albumIds,
        isTrash: photo.isTrash,
      },
    });
  }
  console.log(`[System] Successfully indexed ${vectorSearchService.getIndexedCount()} photos into Vertex AI Vector Search.`);
}

async function startServer() {
  const app = express();

  // Allow large JSON payloads for photo upload
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static serving for public uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Initialize initial vector index
  await bootstrapVectorIndex();

  // --- API Endpoints ---

  // System status
  app.get('/api/system/status', (req: Request, res: Response) => {
    const stats = dbService.getStats();
    const status: SystemStatus = {
      geminiEmbeddingModel: 'gemini-embedding-2-preview',
      hasGeminiKey: aiService.getHasKey(),
      vertexVectorSearchReady: true,
      indexedVectorsCount: vectorSearchService.getIndexedCount(),
      totalPhotosCount: stats.total,
      readyPhotosCount: stats.ready,
      processingCount: stats.processing,
      cloudStorageItems: storageService.getItemCount() + stats.total,
      firestoreConnected: stats.firestoreConnected,
      firebaseProjectId: stats.firebaseProjectId,
    };
    res.json(status);
  });

  // Get photos list
  app.get('/api/photos', async (req: Request, res: Response) => {
    try {
      const albumId = req.query.albumId as string | undefined;
      const isFavorite = req.query.favorite === 'true' ? true : undefined;
      const isTrash = req.query.trash === 'true' ? true : false;

      const photos = await dbService.getPhotos('user_default', {
        albumId,
        isFavorite,
        isTrash,
      });

      res.json(photos);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get photo by ID
  app.get('/api/photos/:id', async (req: Request, res: Response) => {
    try {
      const photo = await dbService.getPhotoById(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      res.json(photo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Search photos using natural language query + Gemini Embedding 2 + Vertex AI Vector Search
  app.post('/api/search', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { query, filters } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Step 1: Interpret natural language query (semantic intent + metadata extraction)
      const interpreted = aiService.interpretNaturalQuery(query);

      // Merge explicit filter overrides if provided
      const effectiveDatePattern = filters?.date || interpreted.dateFilter;
      const effectiveLocation = filters?.location || interpreted.locationFilter;
      const effectiveFavorite = filters?.favorite !== undefined ? filters.favorite : interpreted.favoriteOnly;
      const effectiveAlbum = filters?.albumId || interpreted.albumFilter;

      // Step 2: Convert natural language query into vector embedding with Gemini Embedding 2
      const queryVector = await aiService.embedText(interpreted.semanticQuery);

      // Step 3: Vertex AI Vector Search finds semantically similar photo vectors
      const vectorMatches = await vectorSearchService.queryNearestNeighbors(
        queryVector,
        {
          userId: 'user_default',
          datePattern: effectiveDatePattern,
          location: effectiveLocation,
          isFavorite: effectiveFavorite,
          albumId: effectiveAlbum,
          excludeTrash: true,
        },
        50
      );

      // Step 4: Fetch photo metadata from Firestore
      const matchedPhotos: Photo[] = [];
      for (const match of vectorMatches) {
        // We filter out very low similarity scores unless list is small
        if (match.score > 0.18 || vectorMatches.length <= 4) {
          const photo = await dbService.getPhotoById(match.id);
          if (photo && !photo.isTrash) {
            matchedPhotos.push({
              ...photo,
              similarityScore: Math.round(match.score * 100) / 100,
            });
          }
        }
      }

      const response: SearchResponse = {
        query,
        interpretedFilter: {
          semanticQuery: interpreted.semanticQuery,
          dateFilter: effectiveDatePattern,
          locationFilter: effectiveLocation,
          favoriteOnly: effectiveFavorite,
          albumFilter: effectiveAlbum,
        },
        results: matchedPhotos,
        totalCount: matchedPhotos.length,
        executionTimeMs: Date.now() - startTime,
      };

      res.json(response);
    } catch (err: any) {
      console.error('Search error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Find similar photos using existing vector embedding (NO re-querying Gemini!)
  app.post('/api/photos/:id/similar', async (req: Request, res: Response) => {
    try {
      const photoId = req.params.id;
      const photo = await dbService.getPhotoById(photoId);
      if (!photo) {
        return res.status(404).json({ error: 'Source photo not found' });
      }

      // Query vector index directly using target photo's existing embedding
      const similarMatches = await vectorSearchService.findSimilarPhotos(photoId, 12);

      const similarPhotos: Photo[] = [];
      for (const match of similarMatches) {
        const p = await dbService.getPhotoById(match.id);
        if (p && !p.isTrash) {
          similarPhotos.push({
            ...p,
            similarityScore: Math.round(match.score * 100) / 100,
          });
        }
      }

      res.json({
        sourcePhoto: photo,
        similarPhotos,
      });
    } catch (err: any) {
      console.error('Similar search error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Photo upload pipeline (Asynchronous / progressive status)
  app.post('/api/photos/upload', async (req: Request, res: Response) => {
    try {
      const { filename, dataBase64, dateTaken, location, albumId, mimeType } = req.body;
      if (!dataBase64 || !filename) {
        return res.status(400).json({ error: 'Photo data and filename are required' });
      }

      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Step 1: Upload to Google Cloud Storage
      const stored = await storageService.uploadPhoto(
        photoId,
        filename,
        dataBase64,
        mimeType || 'image/jpeg'
      );

      // Step 2: Create initial photo record in Firestore with status PROCESSING
      const initialPhoto: Photo = {
        id: photoId,
        userId: 'user_default',
        filename,
        storagePath: stored.storagePath,
        thumbnailPath: stored.thumbnailPath,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        dateTaken: dateTaken || new Date().toISOString().split('T')[0],
        location: location || 'Personal Album',
        aiDescription: 'Analyzing photo contents...',
        objects: [],
        activities: [],
        environment: 'Outdoor',
        time: 'Daytime',
        processingStatus: 'PROCESSING',
        isFavorite: false,
        albumIds: albumId ? [albumId] : [],
        isTrash: false,
        createdAt: new Date().toISOString(),
      };

      await dbService.createPhoto(initialPhoto);

      // Return immediately so UI stays responsive and tracks processing state
      res.status(202).json({
        message: 'Photo upload initiated',
        photo: initialPhoto,
      });

      // Execute background processing asynchronously
      (async () => {
        try {
          // AI Vision analysis
          const vision = await aiService.analyzePhotoVision(dataBase64, mimeType || 'image/jpeg');

          // Multimodal embedding generation (Gemini Embedding 2)
          await dbService.updatePhoto(photoId, { processingStatus: 'INDEXING' });
          const embeddingText = `${vision.aiDescription} ${vision.objects.join(' ')} ${vision.activities.join(' ')} ${vision.environment} ${vision.time} ${location || ''}`;
          const vector = await aiService.embedText(embeddingText);

          // Store in Vertex AI Vector Search
          await vectorSearchService.upsertVector({
            id: photoId,
            userId: 'user_default',
            vector,
            metadata: {
              dateTaken: initialPhoto.dateTaken,
              location: initialPhoto.location,
              isFavorite: false,
              albumIds: initialPhoto.albumIds,
              isTrash: false,
            },
          });

          // Mark photo as READY in Firestore
          await dbService.updatePhoto(photoId, {
            aiDescription: vision.aiDescription,
            objects: vision.objects,
            activities: vision.activities,
            environment: vision.environment,
            time: vision.time,
            processingStatus: 'READY',
            embeddingDimension: vector.length,
          });

          console.log(`[Upload Pipeline] Photo ${photoId} indexed and READY.`);
        } catch (bgError) {
          console.error(`[Upload Pipeline Error] ${photoId}:`, bgError);
          await dbService.updatePhoto(photoId, { processingStatus: 'ERROR' });
        }
      })();
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle favorite
  app.patch('/api/photos/:id/favorite', async (req: Request, res: Response) => {
    try {
      const photo = await dbService.getPhotoById(req.params.id);
      if (!photo) return res.status(404).json({ error: 'Photo not found' });

      const newFavorite = !photo.isFavorite;
      const updated = await dbService.updatePhoto(req.params.id, { isFavorite: newFavorite });

      // Update vector index metadata
      const vec = vectorSearchService.getVector(req.params.id);
      if (vec) {
        vec.metadata.isFavorite = newFavorite;
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add/Remove from album
  app.patch('/api/photos/:id/album', async (req: Request, res: Response) => {
    try {
      const { albumId } = req.body;
      if (!albumId) return res.status(400).json({ error: 'albumId is required' });

      const updated = await dbService.togglePhotoAlbum(req.params.id, albumId);
      if (!updated) return res.status(404).json({ error: 'Photo not found' });

      // Update vector metadata
      const vec = vectorSearchService.getVector(req.params.id);
      if (vec) {
        vec.metadata.albumIds = updated.albumIds;
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Move to trash or delete permanently
  app.delete('/api/photos/:id', async (req: Request, res: Response) => {
    try {
      const permanent = req.query.permanent === 'true';
      const success = await dbService.deletePhoto(req.params.id, permanent);

      if (permanent) {
        await vectorSearchService.deleteVector(req.params.id);
      } else {
        const vec = vectorSearchService.getVector(req.params.id);
        if (vec) vec.metadata.isTrash = true;
      }

      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Restore photo from trash
  app.patch('/api/photos/:id/restore', async (req: Request, res: Response) => {
    try {
      const success = await dbService.restorePhoto(req.params.id);
      const vec = vectorSearchService.getVector(req.params.id);
      if (vec) vec.metadata.isTrash = false;
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Albums endpoints
  app.get('/api/albums', async (req: Request, res: Response) => {
    try {
      const albums = await dbService.getAlbums('user_default');
      res.json(albums);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/albums', async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Album name is required' });
      }
      const newAlbum = await dbService.createAlbum('user_default', name.trim());
      res.status(201).json(newAlbum);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/albums/:id', async (req: Request, res: Response) => {
    try {
      const success = await dbService.deleteAlbum(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear all data (photos and albums)
  app.post('/api/data/clear', async (req: Request, res: Response) => {
    try {
      vectorSearchService.clear();
      await dbService.clearAllData();
      res.json({ message: 'All photos and albums have been removed.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/demo/reset', async (req: Request, res: Response) => {
    try {
      vectorSearchService.clear();
      await dbService.clearAllData();
      res.json({ message: 'All demo data removed.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Google AI Photo Search server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
