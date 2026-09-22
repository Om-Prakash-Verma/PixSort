import path from 'path';
import fs from 'fs';

// Google Cloud Storage emulation service
export class GoogleCloudStorageService {
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Stores a photo file (Base64 data or Buffer)
   */
  async uploadPhoto(
    photoId: string,
    filename: string,
    dataBase64: string,
    mimeType: string = 'image/jpeg'
  ): Promise<{ storagePath: string; url: string; thumbnailPath: string; thumbnailUrl: string }> {
    const ext = filename.split('.').pop() || 'jpg';
    const cleanFilename = `${photoId}.${ext}`;
    const storagePath = `gs://photos-bucket-prod/${cleanFilename}`;
    const localFilePath = path.join(this.storageDir, cleanFilename);

    // If it's a data URI, strip header
    const base64Content = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/${cleanFilename}`;

    return {
      storagePath,
      url: publicUrl,
      thumbnailPath: `gs://photos-bucket-prod/thumbnails/${cleanFilename}`,
      thumbnailUrl: publicUrl, // In MVP local storage, thumbnail uses same optimized image
    };
  }

  /**
   * Delete photo from storage
   */
  async deletePhoto(storagePath: string, localUrl: string): Promise<boolean> {
    try {
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
}

export const storageService = new GoogleCloudStorageService();
