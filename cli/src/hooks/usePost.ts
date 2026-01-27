/**
 * usePost hook - fetch single post with replies
 */
import { useState, useEffect, useCallback } from 'react';
import type { Post, Reply } from '../../../lib/types.js';
import { postService } from '../../../lib/services/post-service.js';
import { replyService } from '../../../lib/services/reply-service.js';

export interface UsePostResult {
  post: Post | null;
  replies: Reply[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePost(postId: string): UsePostResult {
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
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

      // Enrich the post using batch method for consistent stats (same as timeline)
      const [enriched] = await postService.enrichPostsBatch([fetchedPost]);

      // Fetch quoted post if present
      if (enriched.quotedPostId && !enriched.quotedPost) {
        const quotedPost = await postService.getPostById(enriched.quotedPostId);
        if (quotedPost) {
          enriched.quotedPost = quotedPost;
        }
      }

      setPost(enriched);

      // Fetch replies (replyService.getReplies already enriches with author info)
      const repliesResult = await replyService.getReplies(postId, { limit: 50 });
      setReplies(repliesResult.documents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, replies, loading, error, refresh: fetchPost };
}
