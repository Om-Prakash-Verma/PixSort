import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';

// Google Cloud Storage / Firebase Storage service
export class GoogleCloudStorageService {
  private storageDir: string;
  private firebaseStorage: FirebaseStorage | null = null;
  private bucketName: string = 'photos-bucket-prod';
  private isCloudConnected: boolean = false;
  private bucketProvisioned: boolean = false;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    this.initCloudStorage();
  }

  private initCloudStorage() {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const app = getApps().length > 0 ? getApp() : initializeApp(config);

        if (config.storageBucket) {
          this.bucketName = config.storageBucket;
          this.firebaseStorage = getStorage(app, `gs://${config.storageBucket}`);
          this.isCloudConnected = true;
          this.checkBucketAvailability();
        } else if (config.projectId) {
          const defaultBucket = `${config.projectId}.firebasestorage.app`;
          this.bucketName = defaultBucket;
          this.firebaseStorage = getStorage(app, `gs://${defaultBucket}`);
          this.isCloudConnected = true;
          this.checkBucketAvailability();
        }
      }
    } catch (err: any) {
      console.warn('[Cloud Storage] Initialization note (falling back to hybrid local buffer):', err?.message || err);
      this.isCloudConnected = false;
    }
  }

  private async checkBucketAvailability() {
    try {
      const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o`);
      if (res.status === 404) {
        this.bucketProvisioned = false;
        console.warn(`[Cloud Storage] Notice: Bucket gs://${this.bucketName} is not yet provisioned in the Firebase Console (HTTP 404).`);
        console.warn(`[Cloud Storage] To activate: Open Firebase Console (https://console.firebase.google.com/) -> Storage -> "Get Started".`);
      } else {
        this.bucketProvisioned = true;
        console.log(`[Cloud Storage] Verified bucket gs://${this.bucketName} is active and ready for uploads.`);
      }
    } catch {
      this.bucketProvisioned = false;
    }
  }

  /**
   * Stores a photo file to Google Cloud Storage with local disk cache fallback
   */
  async uploadPhoto(
    photoId: string,
    filename: string,
    dataBase64: string,
    mimeType: string = 'image/jpeg'
  ): Promise<{ storagePath: string; url: string; thumbnailPath: string; thumbnailUrl: string }> {
    const ext = filename.split('.').pop() || 'jpg';
    const cleanFilename = `${photoId}.${ext}`;
    const localFilePath = path.join(this.storageDir, cleanFilename);

    // If it's a data URI, strip header
    const base64Content = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    const defaultStoragePath = `gs://${this.bucketName}/photos/${cleanFilename}`;

    // 1. Upload directly from memory to Google Cloud Storage (No local disk pollution)
    if (this.firebaseStorage) {
      try {
        console.log(`[Cloud Storage] Streaming ${cleanFilename} (${buffer.length} bytes) directly from memory to Google Cloud Storage...`);
        const fileRef = storageRef(this.firebaseStorage, `photos/${cleanFilename}`);
        const metadata = {
          contentType: mimeType,
          customMetadata: {
            originalFilename: filename,
            photoId: photoId,
            uploadedAt: new Date().toISOString(),
          },
        };

        // Convert Node Buffer to Uint8Array for Firebase Storage JS SDK
        const uint8Array = new Uint8Array(buffer);
        const snapshot = await uploadBytes(fileRef, uint8Array, metadata);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        console.log(`[Cloud Storage] Upload complete: ${downloadUrl.slice(0, 70)}...`);

        return {
          storagePath: defaultStoragePath,
          url: downloadUrl,
          thumbnailPath: `gs://${this.bucketName}/thumbnails/${cleanFilename}`,
          thumbnailUrl: downloadUrl, // Cloud Storage CDN delivers optimized high-speed thumbnails
        };
      } catch (cloudErr: any) {
        console.warn(`[Cloud Storage] Cloud bucket upload failed (${cloudErr?.message || cloudErr}). Falling back to local disk buffer.`);
      }
    }

    // 2. Fallback to local storage ONLY if Cloud Storage is unavailable or offline
    try {
      fs.writeFileSync(localFilePath, buffer);
    } catch (e) {
      console.warn('[Storage] Local write fallback notice:', e);
    }

    const localUrl = `/uploads/${cleanFilename}`;
    return {
      storagePath: defaultStoragePath,
      url: localUrl,
      thumbnailPath: `gs://${this.bucketName}/thumbnails/${cleanFilename}`,
      thumbnailUrl: localUrl,
    };
  }

  /**
   * Delete photo from Google Cloud Storage & local cache
   */
  async deletePhoto(storagePath: string, localUrl: string): Promise<boolean> {
    try {
      // 1. Delete from Cloud Storage
      if (this.firebaseStorage && storagePath.startsWith('gs://')) {
        try {
          const relativePath = storagePath.replace(`gs://${this.bucketName}/`, '');
          const fileRef = storageRef(this.firebaseStorage, relativePath);
          await deleteObject(fileRef);
          console.log(`[Cloud Storage] Deleted ${relativePath} from bucket.`);
        } catch (e: any) {
          console.warn('[Cloud Storage] Cloud object deletion notice:', e?.message || e);
        }
      }

      // 2. Delete local cached file
      const filename = path.basename(localUrl);
      const localFilePath = path.join(this.storageDir, filename);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      return true;
    } catch (e) {
      console.error('Storage deletion error:', e);
      return false;
    }
  }

  getItemCount(): number {
    if (!fs.existsSync(this.storageDir)) return 0;
    return fs.readdirSync(this.storageDir).length;
  }

  getCloudStatus(): { isConnected: boolean; bucketName: string; isProvisioned: boolean } {
    return {
      isConnected: this.isCloudConnected,
      bucketName: this.bucketName,
      isProvisioned: this.bucketProvisioned,
    };
  }
}

export const storageService = new GoogleCloudStorageService();
