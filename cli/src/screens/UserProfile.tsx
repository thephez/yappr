/**
 * UserProfile screen - view user profile with posts
 */
import React from 'react';
import { Box, useInput } from 'ink';
import { Screen, type KeyHint } from '../components/layout/index.js';
import { ProfileHeader } from '../components/user/index.js';
import { PostList } from '../components/post/index.js';
import { Spinner, Error as ErrorDisplay, Empty } from '../components/common/index.js';
import { useProfile } from '../hooks/useProfile.js';
import { useNavigation } from '../store/navigation.js';
import { useIdentity } from '../store/identity.js';
import type { Post } from '../../../lib/types.js';

export interface UserProfileProps {
  userId?: string;
  username?: string;
}

const hints: KeyHint[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'Enter', action: 'open post' },
  { key: 'f', action: 'followers' },
  { key: 'g', action: 'following' },
  { key: 'r', action: 'refresh' },
];

export function UserProfile({ userId, username }: UserProfileProps) {
  const { push } = useNavigation();
  const { identity } = useIdentity();

  const {
    user,
    posts,
    isFollowing,
    balance,
    loading,
    error,
    refresh,
  } = useProfile(userId, username);

  const isOwnProfile = identity?.identityId === user?.id;

  // Keyboard shortcuts
  useInput((input) => {
    if (input === 'r') refresh();
    if (input === 'f' && user) {
      push('followers', { userId: user.id, mode: 'followers' });
    }
    if (input === 'g' && user) {
      push('followers', { userId: user.id, mode: 'following' });
    }
  });

  const handlePostSelect = (post: Post) => {
    push('post', { postId: post.id });
  };

  if (loading && !user) {
    return (
      <Screen title="Profile" hints={hints}>
        <Spinner label="Loading profile..." />
      </Screen>
    );
  }

  if (error || !user) {
    return (
      <Screen title="Profile" hints={hints}>
        <ErrorDisplay message={error || 'User not found'} />
      </Screen>
    );
  }

  return (
    <Screen
      title={user.displayName || user.username}
      subtitle={`@${user.username}`}
      hints={hints}
    >
      <Box flexDirection="column">
        <ProfileHeader
          user={user}
          isFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          balance={isOwnProfile ? balance ?? undefined : undefined}
        />

        {posts.length === 0 ? (
          <Empty message="No posts yet" />
        ) : (
          <PostList posts={posts} onSelect={handlePostSelect} />
        )}
      </Box>
    </Screen>
  );
}
