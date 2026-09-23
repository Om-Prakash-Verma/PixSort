export type PhotoProcessingStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXING' | 'READY' | 'ERROR';

export interface Photo {
  id: string;
  userId: string;
  filename: string;
  storagePath: string;
  thumbnailPath: string;
  url: string;
  thumbnailUrl: string;
  dateTaken: string; // YYYY-MM-DD
  location: string;
  aiDescription: string;
  objects: string[];
  activities: string[];
  environment: string; // 'Indoor' | 'Outdoor' | 'Mixed'
  time: string; // 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Golden Hour'
  processingStatus: PhotoProcessingStatus;
  isFavorite: boolean;
  albumIds: string[];
  isTrash: boolean;
  createdAt: string;
  similarityScore?: number;
  embeddingDimension?: number;
}

export interface Album {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  coverPhotoUrl?: string;
  photoCount: number;
}

export interface SearchInterpretedFilter {
  semanticQuery: string;
  dateFilter?: string;
  locationFilter?: string;
  favoriteOnly?: boolean;
  albumFilter?: string;
}

export interface SearchResponse {
  query: string;
  interpretedFilter: SearchInterpretedFilter;
  results: Photo[];
  totalCount: number;
  executionTimeMs: number;
}

export interface SystemStatus {
  geminiEmbeddingModel: string;
  hasGeminiKey: boolean;
  vertexVectorSearchReady: boolean;
  indexedVectorsCount: number;
  totalPhotosCount: number;
  readyPhotosCount: number;
  processingCount: number;
  cloudStorageItems: number;
  cloudStorageConnected?: boolean;
  cloudStorageBucket?: string;
  firestoreConnected?: boolean;
  firebaseProjectId?: string;
}
