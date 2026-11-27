import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setLogLevel,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { Photo, Album } from '../../src/types.js';

try {
  setLogLevel('error');
} catch {
  // ignore
}

let firestoreDb: Firestore | null = null;
let firestoreProject: string | null = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    firestoreProject = config.projectId;
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    } else {
      firestoreDb = getFirestore(app);
    }
    console.log(`[Firestore] Initialized Firestore for Project: ${config.projectId} (Database: ${config.firestoreDatabaseId || '(default)'})`);
  }
} catch (err) {
  console.warn('[Firestore] Initialization warning, utilizing in-memory operational cache:', err);
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as Partial<T>;
}

export class FirestoreDatabaseService {
  private photos: Map<string, Photo> = new Map();
  private albums: Map<string, Album> = new Map();
  private syncPromise: Promise<void>;

  constructor() {
    this.syncPromise = this.initFirestoreSync().catch((err) => {
      console.warn('[Firestore] Background sync notice:', err.message);
    });
  }

  /**
   * Resolves once initial Firestore hydration completes (or fails gracefully)
   */
  async waitForReady(): Promise<void> {
    await this.syncPromise;
  }

  /**
   * Syncs existing documents from Firestore if present
   */
  async initFirestoreSync(): Promise<void> {
    if (!firestoreDb) return;

    try {
      const photosSnap = await getDocs(collection(firestoreDb, 'photos'));
      this.photos.clear();
      if (photosSnap.docs.length > 0) {
        console.log(`[Firestore] Loaded ${photosSnap.docs.length} persistent photos from cloud Firestore.`);
        photosSnap.docs.forEach((d) => {
          const p = d.data() as Photo;
          this.photos.set(p.id, p);
        });
      }

      const albumsSnap = await getDocs(collection(firestoreDb, 'albums'));
      this.albums.clear();
      if (albumsSnap.docs.length > 0) {
        albumsSnap.docs.forEach((d) => {
          const a = d.data() as Album;
          this.albums.set(a.id, a);
        });
      }

      console.log('[Firestore] Cloud database synchronized.');
    } catch (err: any) {
      if (err.message?.includes('NOT_FOUND') || err.code === 'not-found' || err.message?.includes('not-found')) {
        console.warn(`[Firestore] Notice: Cloud Firestore database has not been provisioned yet in project '${firestoreProject}'. PixSort will run in fast memory cache mode.`);
        firestoreDb = null;
      } else {
        console.warn('[Firestore] Sync notice:', err.message);
      }
    }
  }

  // --- Photo Operations ---

  async getPhotos(userId: string, filters?: {
    albumId?: string;
    isFavorite?: boolean;
    isTrash?: boolean;
  }): Promise<Photo[]> {
    let list = Array.from(this.photos.values()).filter((p) => p.userId === userId);

    if (filters?.isTrash !== undefined) {
      list = list.filter((p) => p.isTrash === filters.isTrash);
    } else {
      list = list.filter((p) => !p.isTrash);
    }

    if (filters?.isFavorite) {
      list = list.filter((p) => p.isFavorite);
    }

    if (filters?.albumId) {
      list = list.filter((p) => p.albumIds.includes(filters.albumId!));
    }

    return list.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
  }

  /**
   * Used only by startup vector index bootstrap across all users
   */
  getAllPhotosForIndex(): Photo[] {
    return Array.from(this.photos.values()).filter((p) => !p.isTrash);
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    return this.photos.get(photoId) || null;
  }

  getPhotoByFilenameOrId(identifier: string): Photo | null {
    const clean = identifier.replace(/\.[^/.]+$/, '');
    for (const p of this.photos.values()) {
      if (
        p.id === identifier ||
        p.id === clean ||
        p.filename === identifier ||
        p.url?.includes(identifier) ||
        p.thumbnailUrl?.includes(identifier) ||
        p.driveFileId === identifier
      ) {
        return p;
      }
    }
    return null;
  }

  async createPhoto(photo: Photo): Promise<Photo> {
    this.photos.set(photo.id, photo);

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'photos', photo.id), stripUndefined(photo));
      } catch (err: any) {
        console.warn(`[Firestore] Failed to persist photo ${photo.id}:`, err.message);
      }
    }

    return photo;
  }

  async updatePhoto(photoId: string, updates: Partial<Photo>): Promise<Photo | null> {
    const existing = this.photos.get(photoId);
    if (!existing) return null;

    const cleanUpdates = stripUndefined(updates);
    const updated = { ...existing, ...cleanUpdates };
    this.photos.set(photoId, updated);

    if (firestoreDb && Object.keys(cleanUpdates).length > 0) {
      try {
        await updateDoc(doc(firestoreDb, 'photos', photoId), cleanUpdates);
      } catch (err: any) {
        console.warn(`[Firestore] Failed to update photo ${photoId}:`, err.message);
      }
    }

    return updated;
  }

  async deletePhoto(photoId: string, permanent: boolean = false): Promise<boolean> {
    if (permanent) {
      const res = this.photos.delete(photoId);
      if (firestoreDb) {
        try {
          await deleteDoc(doc(firestoreDb, 'photos', photoId));
        } catch (err: any) {
          console.warn(`[Firestore] Failed to delete photo ${photoId}:`, err.message);
        }
      }
      return res;
    } else {
      const existing = this.photos.get(photoId);
      if (!existing) return false;
      existing.isTrash = true;
      this.photos.set(photoId, existing);
      if (firestoreDb) {
        try {
          await updateDoc(doc(firestoreDb, 'photos', photoId), { isTrash: true });
        } catch (err: any) {
          console.warn(`[Firestore] Failed to mark photo ${photoId} as trash:`, err.message);
        }
      }
      return true;
    }
  }

  async restorePhoto(photoId: string): Promise<boolean> {
    const existing = this.photos.get(photoId);
    if (!existing) return false;
    existing.isTrash = false;
    this.photos.set(photoId, existing);
    if (firestoreDb) {
      try {
        await updateDoc(doc(firestoreDb, 'photos', photoId), { isTrash: false });
      } catch (err: any) {
        console.warn(`[Firestore] Failed to restore photo ${photoId}:`, err.message);
      }
    }
    return true;
  }

  // --- Album Operations ---

  async getAlbumById(albumId: string): Promise<Album | null> {
    return this.albums.get(albumId) || null;
  }

  async getAlbums(userId: string): Promise<Album[]> {
    const albums = Array.from(this.albums.values()).filter((a) => a.userId === userId);
    return albums.map((alb) => {
      const albumPhotos = Array.from(this.photos.values()).filter(
        (p) => p.userId === userId && !p.isTrash && p.albumIds.includes(alb.id)
      );
      return {
        ...alb,
        photoCount: albumPhotos.length,
        coverPhotoUrl: albumPhotos[0]?.thumbnailUrl || alb.coverPhotoUrl,
      };
    });
  }

  async createAlbum(userId: string, name: string): Promise<Album> {
    const id = `album_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAlbum: Album = {
      id,
      userId,
      name,
      createdAt: new Date().toISOString(),
      photoCount: 0,
    };
    this.albums.set(id, newAlbum);

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'albums', id), newAlbum);
      } catch (err: any) {
        console.warn(`[Firestore] Failed to persist album ${id}:`, err.message);
      }
    }

    return newAlbum;
  }

  async deleteAlbum(albumId: string): Promise<boolean> {
    for (const photo of this.photos.values()) {
      if (photo.albumIds.includes(albumId)) {
        photo.albumIds = photo.albumIds.filter((id) => id !== albumId);
        if (firestoreDb) {
          updateDoc(doc(firestoreDb, 'photos', photo.id), { albumIds: photo.albumIds }).catch(() => {});
        }
      }
    }

    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'albums', albumId));
      } catch {
        // ignore
      }
    }

    return this.albums.delete(albumId);
  }

  async togglePhotoAlbum(photoId: string, albumId: string): Promise<Photo | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;

    if (photo.albumIds.includes(albumId)) {
      photo.albumIds = photo.albumIds.filter((id) => id !== albumId);
    } else {
      photo.albumIds.push(albumId);
    }
    this.photos.set(photoId, photo);

    if (firestoreDb) {
      try {
        await updateDoc(doc(firestoreDb, 'photos', photoId), { albumIds: photo.albumIds });
      } catch {
        // ignore
      }
    }

    return photo;
  }

  getStats(userId?: string) {
    const all = Array.from(this.photos.values()).filter(
      (p) => !userId || p.userId === userId
    );
    const userAlbums = Array.from(this.albums.values()).filter(
      (a) => !userId || a.userId === userId
    );
    return {
      total: all.length,
      ready: all.filter((p) => p.processingStatus === 'READY').length,
      processing: all.filter((p) => p.processingStatus !== 'READY').length,
      trash: all.filter((p) => p.isTrash).length,
      favorites: all.filter((p) => p.isFavorite).length,
      albums: userAlbums.length,
      firestoreConnected: !!firestoreDb,
      firebaseProjectId: firestoreProject || undefined,
    };
  }

  /**
   * Clears only a specific user's photos and albums from memory and Firestore
   */
  public async clearUserData(userId: string): Promise<void> {
    const photoIdsToDelete: string[] = [];
    for (const [id, photo] of this.photos.entries()) {
      if (photo.userId === userId) {
        this.photos.delete(id);
        photoIdsToDelete.push(id);
      }
    }

    const albumIdsToDelete: string[] = [];
    for (const [id, album] of this.albums.entries()) {
      if (album.userId === userId) {
        this.albums.delete(id);
        albumIdsToDelete.push(id);
      }
    }

    if (firestoreDb) {
      try {
        for (const id of photoIdsToDelete) {
          await deleteDoc(doc(firestoreDb, 'photos', id));
        }
        for (const id of albumIdsToDelete) {
          await deleteDoc(doc(firestoreDb, 'albums', id));
        }
      } catch (err: any) {
        console.warn('[Firestore] Error while clearing user data:', err.message);
      }
    }
  }
}

export const dbService = new FirestoreDatabaseService();
