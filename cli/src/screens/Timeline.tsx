/**
 * Timeline screen - global and following feed
 */
import React from 'react';
import { useInput } from 'ink';
import { Screen, TabBar, type KeyHint } from '../components/layout/index.js';
import { PostList } from '../components/post/index.js';
import { Spinner, Error as ErrorDisplay } from '../components/common/index.js';
import { useTimeline } from '../hooks/useTimeline.js';
import { useNavigation } from '../store/navigation.js';
import { useIdentity } from '../store/identity.js';
import type { Post } from '../../../lib/types.js';

export interface TimelineProps {
  initialFeed?: 'global' | 'following';
}

const tabs = [
  { label: 'Global', key: '1' },
  { label: 'Following', key: '2' },
];

const hints: KeyHint[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'Enter', action: 'open' },
  { key: '1/2', action: 'switch tab' },
  { key: 'r', action: 'refresh' },
  { key: '/', action: 'search' },
];

export function Timeline({ initialFeed = 'global' }: TimelineProps) {
  const { push, activeTab, setActiveTab } = useNavigation();
  const { identity } = useIdentity();

  const feed = activeTab === 0 ? 'global' : 'following';
  const { posts, loading, error, hasMore, loadMore, refresh } = useTimeline({ feed });

  // Keyboard shortcuts
  useInput((input) => {
    if (input === '1') setActiveTab(0);
    if (input === '2' && identity) setActiveTab(1);
    if (input === 'r') refresh();
  });

  const handleSelect = (post: Post) => {
    push('post', { postId: post.id });
  };

  const handleAuthorClick = (post: Post) => {
    push('user', { userId: post.author.id });
  };

  return (
    <Screen title="Yappr" subtitle="Timeline" hints={hints}>
      {identity && <TabBar tabs={tabs} activeIndex={activeTab} />}

      {loading && posts.length === 0 ? (
        <Spinner label="Loading timeline..." />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : (
        <PostList
          posts={posts}
          onSelect={handleSelect}
          onLoadMore={loadMore}
          hasMore={hasMore}
        />
      )}
    </Screen>
  );
}
