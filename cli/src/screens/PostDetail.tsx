/**
 * PostDetail screen - view single post with replies
 */
import React from 'react';
import { Box, useInput } from 'ink';
import { Screen, type KeyHint } from '../components/layout/index.js';
import { PostFull, PostList } from '../components/post/index.js';
import { Spinner, Error as ErrorDisplay } from '../components/common/index.js';
import { usePost } from '../hooks/usePost.js';
import { useNavigation } from '../store/navigation.js';
import type { Post, Reply } from '../../../lib/types.js';

export interface PostDetailProps {
  postId: string;
}

const hints: KeyHint[] = [
  { key: 'j/k', action: 'navigate replies' },
  { key: 'Enter', action: 'open reply' },
  { key: 'a', action: 'view author' },
  { key: 'r', action: 'refresh' },
  { key: 'b', action: 'back' },
];

export function PostDetail({ postId }: PostDetailProps) {
  const { push } = useNavigation();
  const { post, replies, loading, error, refresh } = usePost(postId);

  // Keyboard shortcuts
  useInput((input) => {
    if (input === 'r') refresh();
    if (input === 'a' && post) {
      push('user', { userId: post.author.id });
    }
  });

  const handleReplySelect = (reply: Reply) => {
    push('post', { postId: reply.id });
  };

  if (loading && !post) {
    return (
      <Screen title="Post" hints={hints}>
        <Spinner label="Loading post..." />
      </Screen>
    );
  }

  if (error || !post) {
    return (
      <Screen title="Post" hints={hints}>
        <ErrorDisplay message={error || 'Post not found'} />
      </Screen>
    );
  }

  return (
    <Screen title="Post" subtitle={`by @${post.author.username || 'unknown'}`} hints={hints}>
      <Box flexDirection="column">
        <PostFull post={post} />

        {replies.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <PostList
              posts={replies as unknown as Post[]}
              onSelect={handleReplySelect as (post: Post) => void}
              showReplyTo
            />
          </Box>
        )}
      </Box>
    </Screen>
  );
}
