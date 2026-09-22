import { Router, Request, Response } from 'express';
import { dbService } from '../services/database.js';
import { storageService } from '../services/storage.js';
import { aiService } from '../services/ai.js';
import { vectorSearchService } from '../services/vectorSearch.js';
import { Photo } from '../../src/types.js';

export const photosRouter = Router();

// Get photos list
photosRouter.get('/', async (req: Request, res: Response) => {
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
photosRouter.get('/:id', async (req: Request, res: Response) => {
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

// Photo upload pipeline (Asynchronous / progressive status)
photosRouter.post('/upload', async (req: Request, res: Response) => {
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
      aiDescription: 'Analyzing photo contents with Gemini...',
      objects: [],
      activities: [],
      environment: 'Indoor',
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
        console.log(`[Upload Pipeline] Processing AI vision for photo ${photoId} (${filename})...`);
        const vision = await aiService.analyzePhotoVision(
          dataBase64,
          mimeType || 'image/jpeg',
          filename,
          location
        );

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

        console.log(`[Upload Pipeline] Photo ${photoId} indexed and READY with summary: "${vision.aiDescription.slice(0, 50)}..."`);
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
photosRouter.patch('/:id/favorite', async (req: Request, res: Response) => {
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
photosRouter.patch('/:id/album', async (req: Request, res: Response) => {
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

// Find similar photos using existing vector embedding
photosRouter.post('/:id/similar', async (req: Request, res: Response) => {
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

// Restore photo from trash
photosRouter.patch('/:id/restore', async (req: Request, res: Response) => {
  try {
    const success = await dbService.restorePhoto(req.params.id);
    const vec = vectorSearchService.getVector(req.params.id);
    if (vec) vec.metadata.isTrash = false;
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Move to trash or delete permanently
photosRouter.delete('/:id', async (req: Request, res: Response) => {
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
