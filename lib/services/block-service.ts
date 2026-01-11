import { BaseDocumentService, QueryOptions } from './document-service';
import { stateTransitionService } from './state-transition-service';
import { identifierToBase58 } from './sdk-helpers';
import { getEvoSdk } from './evo-sdk-service';

export interface BlockDocument {
  $id: string;
  $ownerId: string;
  $createdAt: number;
  blockedId: string;
}

class BlockService extends BaseDocumentService<BlockDocument> {
  // Granular cache: blockerId -> (targetId -> isBlocked)
  // Caches both positive (blocked) and negative (not blocked) results
  private blockCache = new Map<string, Map<string, boolean>>();

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
   * Batch check if any of the target users are blocked by the blocker.
   * Uses 'in' query with granular caching - only queries uncached IDs.
   * Caches both positive (blocked) and negative (not blocked) results.
   * @returns Map of targetUserId -> isBlocked
   */
  async checkBlockedBatch(blockerId: string, targetIds: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();

    if (!blockerId || targetIds.length === 0) {
      return result;
    }

    // Deduplicate target IDs
    const uniqueTargetIds = Array.from(new Set(targetIds));
    const uncachedIds: string[] = [];

    // Get or create cache for this blocker
    let blockerCache = this.blockCache.get(blockerId);
    if (!blockerCache) {
      blockerCache = new Map();
      this.blockCache.set(blockerId, blockerCache);
    }

    // Check cache first
    for (const targetId of uniqueTargetIds) {
      const cached = blockerCache.get(targetId);
      if (cached !== undefined) {
        result.set(targetId, cached);
      } else {
        uncachedIds.push(targetId);
      }
    }

    // All cached - no query needed
    if (uncachedIds.length === 0) {
      return result;
    }

    // Query platform with 'in' for uncached IDs only
    try {
      const blocks = await this.queryBlockedIn(blockerId, uncachedIds);
      const blockedSet = new Set(blocks.map(b => b.blockedId));

      // Cache results (both positive and negative)
      for (const targetId of uncachedIds) {
        const isBlocked = blockedSet.has(targetId);
        blockerCache.set(targetId, isBlocked);
        result.set(targetId, isBlocked);
      }
    } catch (error) {
      console.error('Error checking blocked batch:', error);
      // On error, return what we have cached, uncached IDs default to false
      for (const targetId of uncachedIds) {
        result.set(targetId, false);
      }
    }

    return result;
  }

  /**
   * Query blocked users using 'in' operator for efficient batch lookup.
   * Uses ownerAndBlocked index: ($ownerId asc, blockedId asc)
   */
  private async queryBlockedIn(blockerId: string, targetIds: string[]): Promise<BlockDocument[]> {
    if (targetIds.length === 0) return [];

    const sdk = await getEvoSdk();

    // Use 'in' operator - pass string IDs directly (SDK handles conversion)
    // Max 100 items per platform limit
    const response = await sdk.documents.query({
      dataContractId: this.contractId,
      documentTypeName: this.documentType,
      where: [
        ['$ownerId', '==', blockerId],
        ['blockedId', 'in', targetIds]
      ],
      orderBy: [['blockedId', 'asc']],
      limit: Math.min(targetIds.length, 100)
    } as any);

    // Handle Map response (v3 SDK)
    let documents: any[] = [];
    if (response instanceof Map) {
      documents = Array.from(response.values())
        .filter(Boolean)
        .map((doc: any) => typeof doc.toJSON === 'function' ? doc.toJSON() : doc);
    } else if (Array.isArray(response)) {
      documents = response;
    } else if (response && (response as any).documents) {
      documents = (response as any).documents;
    }

    return documents.map((doc: any) => this.transformDocument(doc));
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

      // Update cache on success
      if (result.success) {
        const blockerCache = this.blockCache.get(blockerId);
        if (blockerCache) {
          blockerCache.set(targetUserId, true);
        }
      }

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
        // Update cache - not blocked
        const blockerCache = this.blockCache.get(blockerId);
        if (blockerCache) {
          blockerCache.set(targetUserId, false);
        }
        return { success: true };
      }

      const result = await stateTransitionService.deleteDocument(
        this.contractId,
        this.documentType,
        block.$id,
        blockerId
      );

      // Update cache on success
      if (result.success) {
        const blockerCache = this.blockCache.get(blockerId);
        if (blockerCache) {
          blockerCache.set(targetUserId, false);
        }
      }

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
   * Uses checkBlockedBatch with granular caching.
   */
  async isBlocked(targetUserId: string, blockerId: string): Promise<boolean> {
    if (!blockerId || !targetUserId) return false;
    const result = await this.checkBlockedBatch(blockerId, [targetUserId]);
    return result.get(targetUserId) ?? false;
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
   * Count blocked users
   */
  async countUserBlocks(userId: string): Promise<number> {
    const blocks = await this.getUserBlocks(userId);
    return blocks.length;
  }
}

// Singleton instance
export const blockService = new BlockService();
