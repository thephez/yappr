import { BaseDocumentService, QueryOptions } from './document-service';
import { stateTransitionService } from './state-transition-service';
import { identifierToBase58 } from './sdk-helpers';

export interface BlockDocument {
  $id: string;
  $ownerId: string;
  $createdAt: number;
  blockedId: string;
}

class BlockService extends BaseDocumentService<BlockDocument> {
  // In-flight request deduplication: multiple callers share the same promise
  private inFlightBlockedIds = new Map<string, Promise<string[]>>();

  constructor() {
    super('block');
  }

  /**
   * Transform document
   * SDK v3: System fields ($id, $ownerId) are base58, byte array fields (blockedId) are base64
   */
  protected transformDocument(doc: Record<string, unknown>): BlockDocument {
    const data = (doc.data || doc) as Record<string, unknown>;
    const rawBlockedId = data.blockedId;

    // Convert blockedId from base64 to base58 (byte array field)
    const blockedId = rawBlockedId ? identifierToBase58(rawBlockedId) : '';
    if (rawBlockedId && !blockedId) {
      console.error('BlockService: Invalid blockedId format:', rawBlockedId);
    }

    // Handle both $ prefixed (query responses) and non-prefixed (creation responses) fields
    return {
      $id: (doc.$id || doc.id) as string,
      $ownerId: (doc.$ownerId || doc.ownerId) as string,
      $createdAt: (doc.$createdAt || doc.createdAt) as number,
      blockedId: blockedId || ''
    };
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Prevent self-blocking
      if (blockerId === targetUserId) {
        return { success: false, error: 'Cannot block yourself' };
      }

      const existing = await this.getBlock(targetUserId, blockerId);
      if (existing) {
        console.log('Already blocked user');
        return { success: true };
      }

      const bs58Module = await import('bs58');
      const bs58 = bs58Module.default;
      const blockedIdBytes = Array.from(bs58.decode(targetUserId));

      const result = await stateTransitionService.createDocument(
        this.contractId,
        this.documentType,
        blockerId,
        { blockedId: blockedIdBytes }
      );

      return result;
    } catch (error) {
      console.error('Error blocking user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to block user'
      };
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const block = await this.getBlock(targetUserId, blockerId);
      if (!block) {
        console.log('Not blocking user');
        return { success: true };
      }

      const result = await stateTransitionService.deleteDocument(
        this.contractId,
        this.documentType,
        block.$id,
        blockerId
      );

      return result;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unblock user'
      };
    }
  }

  /**
   * Check if blocker has blocked target.
   * Uses getBlockedUserIds() which deduplicates in-flight requests,
   * so 30 calls share 1 network request.
   */
  async isBlocked(targetUserId: string, blockerId: string): Promise<boolean> {
    if (!blockerId || !targetUserId) return false;
    const blockedIds = await this.getBlockedUserIds(blockerId);
    return blockedIds.includes(targetUserId);
  }

  /**
   * Get block relationship
   */
  async getBlock(targetUserId: string, blockerId: string): Promise<BlockDocument | null> {
    try {
      const result = await this.query({
        where: [
          ['$ownerId', '==', blockerId],
          ['blockedId', '==', targetUserId]
        ],
        limit: 1
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error('Error getting block:', error);
      return null;
    }
  }

  /**
   * Get all users blocked by a user
   */
  async getUserBlocks(userId: string, options: QueryOptions = {}): Promise<BlockDocument[]> {
    try {
      const result = await this.query({
        where: [['$ownerId', '==', userId]],
        orderBy: [['$createdAt', 'asc']],
        limit: 100,
        ...options
      });

      return result.documents;
    } catch (error) {
      console.error('Error getting user blocks:', error);
      return [];
    }
  }

  /**
   * Get array of blocked user IDs for filtering.
   * Deduplicates in-flight requests: if called multiple times before the first
   * request completes, all callers share the same promise/network request.
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    if (!userId) return [];

    // Check for in-flight request
    const inFlight = this.inFlightBlockedIds.get(userId);
    if (inFlight) {
      return inFlight;
    }

    // Create new request and store the promise
    const promise = this.getUserBlocks(userId)
      .then(blocks => blocks.map(block => block.blockedId))
      .finally(() => {
        // Clear in-flight after a short delay to allow rapid successive calls to share
        // but not cache stale data indefinitely
        setTimeout(() => this.inFlightBlockedIds.delete(userId), 100);
      });

    this.inFlightBlockedIds.set(userId, promise);
    return promise;
  }

  /**
   * Batch check if any of the target users are blocked by the current user.
   * Efficient: reuses getBlockedUserIds (1 query) then does Set intersection.
   * @returns Map of targetUserId -> isBlocked
   */
  async getBlockStatusBatch(targetUserIds: string[], blockerId: string): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();

    // Initialize all as not blocked
    for (const id of targetUserIds) {
      result.set(id, false);
    }

    if (!blockerId || targetUserIds.length === 0) {
      return result;
    }

    try {
      // Get all blocked IDs for this user (1 query)
      const blockedIds = await this.getBlockedUserIds(blockerId);
      const blockedSet = new Set(blockedIds);

      // Check each target against the blocked set
      for (const targetId of targetUserIds) {
        result.set(targetId, blockedSet.has(targetId));
      }
    } catch (error) {
      console.error('Error getting batch block status:', error);
    }

    return result;
  }

  /**
   * Count blocked users
   */
  async countUserBlocks(userId: string): Promise<number> {
    const blocks = await this.getUserBlocks(userId);
    return blocks.length;
  }
}

// Singleton instance
export const blockService = new BlockService();
