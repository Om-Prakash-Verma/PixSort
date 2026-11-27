import { Router, Response } from 'express';
import { dbService } from '../services/database.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

export const albumsRouter = Router();

albumsRouter.use(requireAuth);

// List albums
albumsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const albums = await dbService.getAlbums(req.userId!);
    res.json(albums);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create album
albumsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Album name is required' });
    }
    const newAlbum = await dbService.createAlbum(req.userId!, name.trim());
    res.status(201).json(newAlbum);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete album (owner-checked)
albumsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const album = await dbService.getAlbumById(req.params.id);
    if (!album || album.userId !== req.userId) {
      return res.status(404).json({ error: 'Album not found' });
    }
    const success = await dbService.deleteAlbum(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
