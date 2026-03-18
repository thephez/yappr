/**
 * Hashtag screen - view posts by hashtag
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useInput } from 'ink';
import { Screen, type KeyHint } from '../components/layout/index.js';
import { PostList } from '../components/post/index.js';
import { Spinner, Error as ErrorDisplay } from '../components/common/index.js';
import { useNavigation } from '../store/navigation.js';
import { postService } from '../../../lib/services/post-service.js';
import type { Post } from '../../../lib/types.js';

export interface HashtagProps {
  tag: string;
}

const hints: KeyHint[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'Enter', action: 'open post' },
  { key: 'r', action: 'refresh' },
  { key: 'b', action: 'back' },
];

export function Hashtag({ tag }: HashtagProps) {
  const { push } = useNavigation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await postService.getPostsByHashtag(tag, { limit: 50 });
      const enriched = await postService.enrichPostsBatch(result.documents);
      setPosts(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useInput((input) => {
    if (input === 'r') fetchPosts();
  });

  const handlePostSelect = (post: Post) => {
    push('post', { postId: post.id });
  };

  if (loading && posts.length === 0) {
    return (
      <Screen title={`#${tag}`} hints={hints}>
        <Spinner label="Loading posts..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen title={`#${tag}`} hints={hints}>
        <ErrorDisplay message={error} />
      </Screen>
    );
  }

  return (
    <Screen title={`#${tag}`} subtitle={`${posts.length} posts`} hints={hints}>
      <PostList posts={posts} onSelect={handlePostSelect} />
    </Screen>
  );
}
