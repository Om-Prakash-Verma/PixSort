import { Router, Response } from 'express';
import { semanticSearchEngine } from '../services/semanticSearch.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

// Search photos using natural language semantic search engine
searchRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, filters } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchResponse = await semanticSearchEngine.executeSearch(query, filters, req.userId!);
    res.json(searchResponse);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});
