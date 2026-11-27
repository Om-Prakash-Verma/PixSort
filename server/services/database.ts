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
import { vectorSearchService } from './vectorSearch.js';
import { semanticSearchEngine } from './semanticSearch.js';

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

function toFirestoreValue(val: any): Record<string, any> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((v) => toFirestoreValue(v)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: Record<string, any>): any {
  if (!val || 'nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map((v: any) => fromFirestoreValue(v))
      : [];
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
      out[k] = fromFirestoreValue(v as Record<string, any>);
    }
    return out;
  }
  return null;
}

async function firestoreRestQuery(
  collectionName: string,
  userId: string,
  idToken: string
): Promise<Record<string, any>[]> {
  if (!firestoreProject) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${firestoreProject}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'userId' },
            op: 'EQUAL',
            value: { stringValue: userId },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status));
    throw new Error(`Firestore REST query ${res.status}: ${errText}`);
  }
  const rows = (await res.json()) as Array<{ document?: { fields?: Record<string, any> } }>;
  const docs: Record<string, any>[] = [];
  for (const row of rows) {
    if (!row.document?.fields) continue;
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(row.document.fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    docs.push(obj);
  }
  return docs;
}

async function firestoreRestWrite(
  method: 'PATCH' | 'DELETE',
  collectionName: string,
  docId: string,
  data: Record<string, any> | null,
  idToken: string,
  isPartialUpdate = false
): Promise<void> {
  if (!firestoreProject) return;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProject}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}`;
  let url = baseUrl;
  let body: string | undefined;

  if (method === 'PATCH' && data) {
    const clean = stripUndefined(data);
    const keys = Object.keys(clean);
    if (keys.length === 0) return;
    if (isPartialUpdate) {
      const mask = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
      url = `${baseUrl}?${mask}`;
    }
    const fields: Record<string, any> = {};
    for (const k of keys) {
      fields[k] = toFirestoreValue(clean[k]);
    }
    body = JSON.stringify({ fields });
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status));
    throw new Error(`Firestore REST ${res.status}: ${errText}`);
  }
}

export class FirestoreDatabaseService {
  private photos: Map<string, Photo> = new Map();
  private albums: Map<string, Album> = new Map();
  private hydratedUsers: Set<string> = new Set();
  private hydrationInFlight: Map<string, Promise<void>> = new Map();
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

  /**
   * Hydrates a specific user's photos & albums from Firestore using their verified ID token
   * (needed after server restarts when Firestore rules require request.auth != null).
   */
  async ensureUserHydrated(userId: string, idToken?: string): Promise<void> {
    if (!idToken || this.hydratedUsers.has(userId) || userId.startsWith('guest_')) return;
    const existing = this.hydrationInFlight.get(userId);
    if (existing) {
      await existing;
      return;
    }

    const promise = (async () => {
      try {
        const [userPhotos, userAlbums] = await Promise.all([
          firestoreRestQuery('photos', userId, idToken),
          firestoreRestQuery('albums', userId, idToken),
        ]);

        for (const raw of userPhotos) {
          const photo = {
            ...raw,
            objects: Array.isArray(raw.objects) ? raw.objects : [],
            activities: Array.isArray(raw.activities) ? raw.activities : [],
            albumIds: Array.isArray(raw.albumIds) ? raw.albumIds : [],
          } as Photo;
          if (!photo.id) continue;
          this.photos.set(photo.id, photo);

          if (!photo.isTrash && !vectorSearchService.getVector(photo.id)) {
            const textContext = `${photo.aiDescription || ''} ${photo.objects.join(' ')} ${photo.activities.join(' ')} ${photo.environment || ''} ${photo.time || ''} ${photo.location || ''}`;
            const vector = semanticSearchEngine.generateDenseVector(textContext);
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
        }

        for (const raw of userAlbums) {
          const album = raw as Album;
          if (album.id) this.albums.set(album.id, album);
        }

        this.hydratedUsers.add(userId);
        if (userPhotos.length > 0 || userAlbums.length > 0) {
          console.log(`[Firestore] Hydrated ${userPhotos.length} photos & ${userAlbums.length} albums for user ${userId}.`);
        }
      } catch (err: any) {
        console.warn(`[Firestore] User hydration warning for ${userId}:`, err.message);
      } finally {
        this.hydrationInFlight.delete(userId);
      }
    })();

    this.hydrationInFlight.set(userId, promise);
    await promise;
  }

  // --- Photo Operations ---

  async getPhotos(
    userId: string,
    filters?: {
      albumId?: string;
      isFavorite?: boolean;
      isTrash?: boolean;
    },
    idToken?: string
  ): Promise<Photo[]> {
    await this.ensureUserHydrated(userId, idToken);
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

  async createPhoto(photo: Photo, idToken?: string): Promise<Photo> {
    this.photos.set(photo.id, photo);

    if (idToken) {
      try {
        await firestoreRestWrite('PATCH', 'photos', photo.id, photo, idToken, false);
      } catch (err: any) {
        console.warn(`[Firestore] Failed to persist photo ${photo.id}:`, err.message);
      }
    } else if (firestoreDb && !photo.userId.startsWith('guest_')) {
      try {
        await setDoc(doc(firestoreDb, 'photos', photo.id), stripUndefined(photo));
      } catch (err: any) {
        console.warn(`[Firestore] Failed to persist photo ${photo.id}:`, err.message);
      }
    }

    return photo;
  }

  async updatePhoto(photoId: string, updates: Partial<Photo>, idToken?: string): Promise<Photo | null> {
    const existing = this.photos.get(photoId);
    if (!existing) return null;

    const cleanUpdates = stripUndefined(updates);
    const updated = { ...existing, ...cleanUpdates };
    this.photos.set(photoId, updated);

    if (Object.keys(cleanUpdates).length > 0) {
      if (idToken) {
        try {
          await firestoreRestWrite('PATCH', 'photos', photoId, cleanUpdates, idToken, true);
        } catch (err: any) {
          console.warn(`[Firestore] Failed to update photo ${photoId}:`, err.message);
        }
      } else if (firestoreDb && !existing.userId.startsWith('guest_')) {
        try {
          await updateDoc(doc(firestoreDb, 'photos', photoId), cleanUpdates);
        } catch (err: any) {
          console.warn(`[Firestore] Failed to update photo ${photoId}:`, err.message);
        }
      }
    }

    return updated;
  }

  async deletePhoto(photoId: string, permanent: boolean = false, idToken?: string): Promise<boolean> {
    const existing = this.photos.get(photoId);
    if (permanent) {
      const res = this.photos.delete(photoId);
      if (idToken) {
        try {
          await firestoreRestWrite('DELETE', 'photos', photoId, null, idToken);
        } catch (err: any) {
          console.warn(`[Firestore] Failed to delete photo ${photoId}:`, err.message);
        }
      } else if (firestoreDb && existing && !existing.userId.startsWith('guest_')) {
        try {
          await deleteDoc(doc(firestoreDb, 'photos', photoId));
        } catch (err: any) {
          console.warn(`[Firestore] Failed to delete photo ${photoId}:`, err.message);
        }
      }
      return res;
    } else {
      if (!existing) return false;
      existing.isTrash = true;
      this.photos.set(photoId, existing);
      if (idToken) {
        try {
          await firestoreRestWrite('PATCH', 'photos', photoId, { isTrash: true }, idToken, true);
        } catch (err: any) {
          console.warn(`[Firestore] Failed to mark photo ${photoId} as trash:`, err.message);
        }
      } else if (firestoreDb && !existing.userId.startsWith('guest_')) {
        try {
          await updateDoc(doc(firestoreDb, 'photos', photoId), { isTrash: true });
        } catch (err: any) {
          console.warn(`[Firestore] Failed to mark photo ${photoId} as trash:`, err.message);
        }
      }
      return true;
    }
  }

  async restorePhoto(photoId: string, idToken?: string): Promise<boolean> {
    const existing = this.photos.get(photoId);
    if (!existing) return false;
    existing.isTrash = false;
    this.photos.set(photoId, existing);
    if (idToken) {
      try {
        await firestoreRestWrite('PATCH', 'photos', photoId, { isTrash: false }, idToken, true);
      } catch (err: any) {
        console.warn(`[Firestore] Failed to restore photo ${photoId}:`, err.message);
      }
    } else if (firestoreDb && !existing.userId.startsWith('guest_')) {
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

  async getAlbums(userId: string, idToken?: string): Promise<Album[]> {
    await this.ensureUserHydrated(userId, idToken);
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

  async createAlbum(userId: string, name: string, idToken?: string): Promise<Album> {
    const id = `album_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAlbum: Album = {
      id,
      userId,
      name,
      createdAt: new Date().toISOString(),
      photoCount: 0,
    };
    this.albums.set(id, newAlbum);

    if (idToken) {
      try {
        await firestoreRestWrite('PATCH', 'albums', id, newAlbum, idToken, false);
      } catch (err: any) {
        console.warn(`[Firestore] Failed to persist album ${id}:`, err.message);
      }
    } else if (firestoreDb && !userId.startsWith('guest_')) {
      try {
        await setDoc(doc(firestoreDb, 'albums', id), newAlbum);
      } catch (err: any) {
        console.warn(`[Firestore] Failed to persist album ${id}:`, err.message);
      }
    }

    return newAlbum;
  }

  async deleteAlbum(albumId: string, idToken?: string): Promise<boolean> {
    const existingAlbum = this.albums.get(albumId);
    for (const photo of this.photos.values()) {
      if (photo.albumIds.includes(albumId)) {
        photo.albumIds = photo.albumIds.filter((id) => id !== albumId);
        if (idToken) {
          firestoreRestWrite('PATCH', 'photos', photo.id, { albumIds: photo.albumIds }, idToken, true).catch(() => {});
        } else if (firestoreDb && !photo.userId.startsWith('guest_')) {
          updateDoc(doc(firestoreDb, 'photos', photo.id), { albumIds: photo.albumIds }).catch(() => {});
        }
      }
    }

    if (idToken) {
      try {
        await firestoreRestWrite('DELETE', 'albums', albumId, null, idToken);
      } catch {
        // ignore
      }
    } else if (firestoreDb && existingAlbum && !existingAlbum.userId.startsWith('guest_')) {
      try {
        await deleteDoc(doc(firestoreDb, 'albums', albumId));
      } catch {
        // ignore
      }
    }

    return this.albums.delete(albumId);
  }

  async togglePhotoAlbum(photoId: string, albumId: string, idToken?: string): Promise<Photo | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;

    if (photo.albumIds.includes(albumId)) {
      photo.albumIds = photo.albumIds.filter((id) => id !== albumId);
    } else {
      photo.albumIds.push(albumId);
    }
    this.photos.set(photoId, photo);

    if (idToken) {
      try {
        await firestoreRestWrite('PATCH', 'photos', photoId, { albumIds: photo.albumIds }, idToken, true);
      } catch {
        // ignore
      }
    } else if (firestoreDb && !photo.userId.startsWith('guest_')) {
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
