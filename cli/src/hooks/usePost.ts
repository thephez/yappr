/**
 * usePost hook - fetch single post with replies
 */
import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../../../lib/types.js';
import { postService } from '../../../lib/services/post-service.js';
import { useIdentity } from '../store/identity.js';

export interface UsePostResult {
  post: Post | null;
  replies: Post[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePost(postId: string): UsePostResult {
  const { identity } = useIdentity();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the post
      const fetchedPost = await postService.getPostById(postId);
      if (!fetchedPost) {
        setError('Post not found');
        setPost(null);
        setReplies([]);
        return;
      }

      // Enrich the post
      const enriched = await postService.enrichPostFull(fetchedPost);

      // Add user interactions if logged in
      if (identity?.identityId) {
        const interactions = await postService.getBatchUserInteractions(
          [postId],
          identity.identityId
        );
        const interaction = interactions.get(postId);
        if (interaction) {
          enriched.liked = interaction.liked;
          enriched.reposted = interaction.reposted;
          enriched.bookmarked = interaction.bookmarked;
        }
      }

      // Fetch quoted post if present
      if (enriched.quotedPostId && !enriched.quotedPost) {
        const quotedPost = await postService.getPostById(enriched.quotedPostId);
        if (quotedPost) {
          enriched.quotedPost = quotedPost;
        }
      }

      setPost(enriched);

      // Fetch replies
      const repliesResult = await postService.getReplies(postId, { limit: 50 });
      const enrichedReplies = await postService.enrichPostsBatch(repliesResult.documents);
      setReplies(enrichedReplies);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, identity?.identityId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, replies, loading, error, refresh: fetchPost };
}
