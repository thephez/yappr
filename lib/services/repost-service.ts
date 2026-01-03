import { BaseDocumentService, QueryOptions } from './document-service';
import { stateTransitionService } from './state-transition-service';

export interface RepostDocument {
  $id: string;
  $ownerId: string;
  $createdAt: number;
  postId: string;
}

class RepostService extends BaseDocumentService<RepostDocument> {
  constructor() {
    super('repost');
  }

  /**
   * Transform document
   */
  protected transformDocument(doc: any): RepostDocument {
    // Handle different document structures from SDK
    // Batch queries return: { id, ownerId, data: { postId } }
    // Regular queries return: { $id, $ownerId, postId }
    const data = doc.data || doc;
    let postId = data.postId || doc.postId;

    // Convert postId from bytes to base58 string if needed
    if (postId && typeof postId !== 'string') {
      try {
        const bytes = postId instanceof Uint8Array ? postId : new Uint8Array(postId);
        const bs58 = require('bs58');
        postId = bs58.encode(bytes);
      } catch (e) {
        console.warn('Failed to convert postId to base58:', e);
        postId = String(postId);
      }
    }

    return {
      $id: doc.$id || doc.id,
      $ownerId: doc.$ownerId || doc.ownerId,
      $createdAt: doc.$createdAt || doc.createdAt,
      postId
    };
  }

  /**
   * Repost a post
   */
  async repostPost(postId: string, ownerId: string): Promise<boolean> {
    try {
      // Check if already reposted
      const existing = await this.getRepost(postId, ownerId);
      if (existing) {
        console.log('Post already reposted');
        return true;
      }

      // Convert postId to byte array
      // Use Array.from() because Uint8Array doesn't serialize properly through SDK
      const bs58Module = await import('bs58');
      const bs58 = bs58Module.default;
      const postIdBytes = Array.from(bs58.decode(postId));

      // Use state transition service for creation
      const result = await stateTransitionService.createDocument(
        this.contractId,
        this.documentType,
        ownerId,
        { postId: postIdBytes }
      );

      return result.success;
    } catch (error) {
      console.error('Error reposting:', error);
      return false;
    }
  }

  /**
   * Remove repost
   */
  async removeRepost(postId: string, ownerId: string): Promise<boolean> {
    try {
      const repost = await this.getRepost(postId, ownerId);
      if (!repost) {
        console.log('Post not reposted');
        return true;
      }

      // Use state transition service for deletion
      const result = await stateTransitionService.deleteDocument(
        this.contractId,
        this.documentType,
        repost.$id,
        ownerId
      );

      return result.success;
    } catch (error) {
      console.error('Error removing repost:', error);
      return false;
    }
  }

  /**
   * Check if post is reposted by user
   */
  async isReposted(postId: string, ownerId: string): Promise<boolean> {
    const repost = await this.getRepost(postId, ownerId);
    return repost !== null;
  }

  /**
   * Get repost by post and owner
   */
  async getRepost(postId: string, ownerId: string): Promise<RepostDocument | null> {
    try {
      // Pass identifier as base58 string - the SDK handles conversion
      const result = await this.query({
        where: [
          ['postId', '==', postId],
          ['$ownerId', '==', ownerId]
        ],
        limit: 1
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error('Error getting repost:', error);
      return null;
    }
  }

  /**
   * Get reposts for a post
   */
  async getPostReposts(postId: string, options: QueryOptions = {}): Promise<RepostDocument[]> {
    try {
      // Pass identifier as base58 string - the SDK handles conversion
      // Dash Platform requires a where clause on the orderBy field for ordering to work
      const result = await this.query({
        where: [
          ['postId', '==', postId],
          ['$createdAt', '>', 0]
        ],
        orderBy: [['$createdAt', 'asc']],
        limit: 50,
        ...options
      });

      return result.documents;
    } catch (error) {
      console.error('Error getting post reposts:', error);
      return [];
    }
  }

  /**
   * Get user's reposts
   */
  async getUserReposts(userId: string, options: QueryOptions = {}): Promise<RepostDocument[]> {
    try {
      // Dash Platform requires a where clause on the orderBy field for ordering to work
      const result = await this.query({
        where: [
          ['$ownerId', '==', userId],
          ['$createdAt', '>', 0]
        ],
        orderBy: [['$createdAt', 'asc']],
        limit: 50,
        ...options
      });

      return result.documents;
    } catch (error) {
      console.error('Error getting user reposts:', error);
      return [];
    }
  }

  /**
   * Count reposts for a post
   */
  async countReposts(postId: string): Promise<number> {
    const reposts = await this.getPostReposts(postId);
    return reposts.length;
  }

  /**
   * Get reposts for multiple posts in a single batch query
   * Uses 'in' operator for efficient querying
   */
  async getRepostsByPostIds(postIds: string[]): Promise<RepostDocument[]> {
    if (postIds.length === 0) return [];

    try {
      const sdk = await import('../services/evo-sdk-service').then(m => m.getEvoSdk());

      // Use 'in' operator for batch query on postId
      // Must include orderBy to match the postReposts index: [postId, $createdAt]
      const response = await sdk.documents.query({
        contractId: this.contractId,
        type: 'repost',
        where: [['postId', 'in', postIds]],
        orderBy: [['postId', 'asc']],
        limit: 100
      });

      let documents: any[] = [];
      if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === 'function') {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }

      return documents.map((doc: any) => this.transformDocument(doc));
    } catch (error) {
      console.error('Error getting reposts batch:', error);
      return [];
    }
  }
}

// Singleton instance
export const repostService = new RepostService();