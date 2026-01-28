/**
 * PostList component - scrollable list of posts
 */
import React from 'react';
import { Box } from 'ink';
import type { Post } from '../../../lib/types.js';
import { ScrollList } from '../common/ScrollList.js';
import { PostCard } from './PostCard.js';
import { Empty } from '../common/Empty.js';

export interface PostListProps {
  posts: Post[];
  onSelect?: (post: Post) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  height?: number;
  showReplyTo?: boolean;
}

export function PostList({
  posts,
  onSelect,
  onLoadMore,
  hasMore,
  height,
  showReplyTo,
}: PostListProps) {
  if (posts.length === 0) {
    return <Empty message="No posts yet" hint="Check back later for new content" />;
  }

  return (
    <ScrollList
      items={posts}
      height={height}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      onSelect={(post) => onSelect?.(post)}
      renderItem={(post, index, isSelected) => (
        <PostCard post={post} selected={isSelected} showReplyTo={showReplyTo} />
      )}
    />
  );
}
