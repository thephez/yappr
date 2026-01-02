import { BaseDocumentService, QueryOptions } from './document-service';
import { stateTransitionService } from './state-transition-service';

export interface LikeDocument {
  $id: string;
  $ownerId: string;
  $createdAt: number;
  postId: string;
}

class LikeService extends BaseDocumentService<LikeDocument> {
  constructor() {
    super('like');
  }

  /**
   * Transform document
   */
  protected transformDocument(doc: any): LikeDocument {
    return {
      $id: doc.$id,
      $ownerId: doc.$ownerId,
      $createdAt: doc.$createdAt,
      postId: doc.postId
    };
  }

  /**
   * Like a post
   */
  async likePost(postId: string, ownerId: string): Promise<boolean> {
    try {
      // Check if already liked
      const existing = await this.getLike(postId, ownerId);
      if (existing) {
        console.log('Post already liked');
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
      console.error('Error liking post:', error);
      return false;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, ownerId: string): Promise<boolean> {
    try {
      const like = await this.getLike(postId, ownerId);
      if (!like) {
        console.log('Post not liked');
        return true;
      }

      // Use state transition service for deletion
      const result = await stateTransitionService.deleteDocument(
        this.contractId,
        this.documentType,
        like.$id,
        ownerId
      );

      return result.success;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  }

  /**
   * Check if post is liked by user
   */
  async isLiked(postId: string, ownerId: string): Promise<boolean> {
    const like = await this.getLike(postId, ownerId);
    return like !== null;
  }

  /**
   * Get like by post and owner
   */
  async getLike(postId: string, ownerId: string): Promise<LikeDocument | null> {
    try {
      // Get SDK instance using EvoSDK
      const sdk = await import('../services/evo-sdk-service').then(m => m.getEvoSdk());

      // Pass identifier as base58 string - the SDK handles conversion
      const where = [
        ['postId', '==', postId],
        ['$ownerId', '==', ownerId]
      ];

      // Query using EvoSDK documents facade
      const response = await sdk.documents.query({
        contractId: this.contractId,
        type: 'like',
        where,
        limit: 1
      });

      // Convert response
      let documents;
      if (response && typeof response.toJSON === 'function') {
        documents = response.toJSON();
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (Array.isArray(response)) {
        documents = response;
      } else {
        documents = [];
      }

      return documents.length > 0 ? this.transformDocument(documents[0]) : null;
    } catch (error) {
      console.error('Error getting like:', error);
      return null;
    }
  }

  /**
   * Get likes for a post
   */
  async getPostLikes(postId: string, options: QueryOptions = {}): Promise<LikeDocument[]> {
    try {
      // Get SDK instance using EvoSDK
      const sdk = await import('../services/evo-sdk-service').then(m => m.getEvoSdk());

      // Pass identifier as base58 string - the SDK handles conversion
      // Dash Platform requires a where clause on the orderBy field for ordering to work
      const where = [
        ['postId', '==', postId],
        ['$createdAt', '>', 0]
      ];
      const orderBy = [['$createdAt', 'asc']];

      // Query using EvoSDK documents facade
      const response = await sdk.documents.query({
        contractId: this.contractId,
        type: 'like',
        where,
        orderBy,
        limit: options.limit || 50
      });

      // Convert response
      let documents;
      if (response && typeof response.toJSON === 'function') {
        documents = response.toJSON();
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (Array.isArray(response)) {
        documents = response;
      } else {
        documents = [];
      }

      // Transform documents
      return documents.map((doc: any) => this.transformDocument(doc));

    } catch (error) {
      console.error('Error getting post likes:', error);
      return [];
    }
  }

  /**
   * Get user's likes
   */
  async getUserLikes(userId: string, options: QueryOptions = {}): Promise<LikeDocument[]> {
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
      console.error('Error getting user likes:', error);
      return [];
    }
  }

  /**
   * Count likes given by a user - uses direct SDK query for reliability
   */
  async countUserLikes(userId: string): Promise<number> {
    try {
      const sdk = await import('../services/evo-sdk-service').then(m => m.getEvoSdk());

      // Dash Platform requires a where clause on the orderBy field for ordering to work
      const response = await sdk.documents.query({
        contractId: this.contractId,
        type: 'like',
        where: [
          ['$ownerId', '==', userId],
          ['$createdAt', '>', 0]
        ],
        orderBy: [['$createdAt', 'asc']],
        limit: 100
      });

      let documents;
      if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === 'function') {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      } else {
        documents = [];
      }

      return documents.length;
    } catch (error) {
      console.error('Error counting user likes:', error);
      return 0;
    }
  }

  /**
   * Count likes for a post
   */
  async countLikes(postId: string): Promise<number> {
    // In a real implementation, this would be more efficient
    const likes = await this.getPostLikes(postId);
    return likes.length;
  }
}

// Singleton instance
export const likeService = new LikeService();