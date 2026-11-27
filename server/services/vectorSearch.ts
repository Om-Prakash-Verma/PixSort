export interface VectorItem {
  id: string; // photoId
  userId: string;
  vector: number[];
  metadata: {
    dateTaken: string;
    location: string;
    isFavorite: boolean;
    albumIds: string[];
    isTrash: boolean;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
}

export class VertexAIVectorSearchService {
  private index: Map<string, VectorItem> = new Map();

  async upsertVector(item: VectorItem): Promise<void> {
    this.index.set(item.id, item);
  }

  async deleteVector(id: string): Promise<boolean> {
    return this.index.delete(id);
  }

  getVector(id: string): VectorItem | undefined {
    return this.index.get(id);
  }

  /**
   * Returns true if the user has any indexed vectors of the given dimension
   */
  hasVectorsWithDimension(userId: string, dimension: number): boolean {
    for (const item of this.index.values()) {
      if (item.userId === userId && item.vector.length === dimension) {
        return true;
      }
    }
    return false;
  }

  /**
   * Query nearest neighbors using Cosine Similarity with metadata filtering
   */
  async queryNearestNeighbors(
    queryVector: number[],
    filters?: {
      userId?: string;
      datePattern?: string;
      location?: string;
      isFavorite?: boolean;
      albumId?: string;
      excludeTrash?: boolean;
    },
    topK: number = 20
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];
    const queryNorm = this.vectorNorm(queryVector);

    if (queryNorm === 0) return [];

    for (const item of this.index.values()) {
      if (filters?.userId && item.userId !== filters.userId) continue;
      if (filters?.excludeTrash !== false && item.metadata.isTrash) continue;
      if (filters?.isFavorite !== undefined && item.metadata.isFavorite !== filters.isFavorite) continue;
      if (filters?.albumId && !item.metadata.albumIds.includes(filters.albumId)) continue;

      if (filters?.datePattern) {
        if (!item.metadata.dateTaken.includes(filters.datePattern)) continue;
      }

      if (filters?.location) {
        if (!item.metadata.location.toLowerCase().includes(filters.location.toLowerCase())) continue;
      }

      // Never compare vectors from incompatible embedding spaces/dimensions
      if (item.vector.length !== queryVector.length) continue;

      const itemNorm = this.vectorNorm(item.vector);
      if (itemNorm === 0) continue;

      const dot = this.dotProduct(queryVector, item.vector);
      const similarity = dot / (queryNorm * itemNorm);

      results.push({
        id: item.id,
        score: Math.max(0, Math.min(1, similarity)),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Find similar photos directly using the existing vector embedding
   */
  async findSimilarPhotos(
    photoId: string,
    topK: number = 6,
    userId?: string
  ): Promise<VectorSearchResult[]> {
    const target = this.index.get(photoId);
    if (!target) return [];
    if (userId && target.userId !== userId) return [];

    const all = await this.queryNearestNeighbors(
      target.vector,
      {
        userId: target.userId,
        excludeTrash: true,
      },
      topK + 1
    );

    return all.filter((r) => r.id !== photoId).slice(0, topK);
  }

  getIndexedCount(userId?: string): number {
    if (!userId) return this.index.size;
    let count = 0;
    for (const item of this.index.values()) {
      if (item.userId === userId) count++;
    }
    return count;
  }

  clearUser(userId: string) {
    for (const [id, item] of this.index.entries()) {
      if (item.userId === userId) {
        this.index.delete(id);
      }
    }
  }

  clear() {
    this.index.clear();
  }

  private dotProduct(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  private vectorNorm(v: number[]): number {
    let sumSq = 0;
    for (let i = 0; i < v.length; i++) {
      sumSq += v[i] * v[i];
    }
    return Math.sqrt(sumSq);
  }
}

export const vectorSearchService = new VertexAIVectorSearchService();
