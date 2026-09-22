import { Router, Request, Response } from 'express';
import { dbService } from '../services/database.js';

export const albumsRouter = Router();

// List albums
albumsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const albums = await dbService.getAlbums('user_default');
    res.json(albums);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create album
albumsRouter.post('/', async (req: Request, res: Response) => {
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

// Delete album
albumsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await dbService.deleteAlbum(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
