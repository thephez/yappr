/**
 * useTimeline hook - fetch timeline posts with pagination
 */
import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../../../lib/types.js';
import { postService } from '../../../lib/services/post-service.js';
import { useIdentity } from '../store/identity.js';

export interface UseTimelineOptions {
  limit?: number;
  feed?: 'global' | 'following';
}

export interface UseTimelineResult {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTimeline(options: UseTimelineOptions = {}): UseTimelineResult {
  const { limit = 20, feed = 'global' } = options;
  const { identity } = useIdentity();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (feed === 'following' && identity?.identityId) {
        // Fetch following feed
        result = await postService.getFollowingFeed(identity.identityId, {
          limit,
          startAfter: isRefresh ? undefined : cursor,
        });
      } else {
        // Fetch global timeline
        result = await postService.getTimeline({
          limit,
          startAfter: isRefresh ? undefined : cursor,
        });
      }

      // Enrich posts with stats and author info
      const enriched = await postService.enrichPostsBatch(result.documents);

      // If user is logged in, add their interaction status
      if (identity?.identityId && enriched.length > 0) {
        const postIds = enriched.map((p) => p.id);
        const interactions = await postService.getBatchUserInteractions(
          postIds,
          identity.identityId
        );
        for (const post of enriched) {
          const interaction = interactions.get(post.id);
          if (interaction) {
            post.liked = interaction.liked;
            post.reposted = interaction.reposted;
            post.bookmarked = interaction.bookmarked;
          }
        }
      }

      if (isRefresh) {
        setPosts(enriched);
      } else {
        setPosts((prev) => [...prev, ...enriched]);
      }

      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor && enriched.length === limit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [feed, identity?.identityId, limit, cursor]);

  // Initial load
  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    fetchPosts(true);
  }, [feed, identity?.identityId]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts(false);
    }
  }, [loading, hasMore, fetchPosts]);

  const refresh = useCallback(async () => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    await fetchPosts(true);
  }, [fetchPosts]);

  return { posts, loading, error, hasMore, loadMore, refresh };
}
