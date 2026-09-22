import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai.js';
import { vectorSearchService } from '../services/vectorSearch.js';
import { dbService } from '../services/database.js';
import { Photo, SearchResponse } from '../../src/types.js';

export const searchRouter = Router();

// Search photos using natural language query + Gemini Embedding 2 + Vertex AI Vector Search
searchRouter.post('/', async (req: Request, res: Response) => {
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
