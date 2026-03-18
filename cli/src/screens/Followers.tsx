/**
 * Followers screen - view followers or following list
 */
import React from 'react';
import { useInput } from 'ink';
import { Screen, type KeyHint } from '../components/layout/index.js';
import { UserList } from '../components/user/index.js';
import { Spinner, Error as ErrorDisplay } from '../components/common/index.js';
import { useFollowers, type FollowMode } from '../hooks/useFollowers.js';
import { useNavigation } from '../store/navigation.js';
import type { User } from '../../../lib/types.js';

export interface FollowersProps {
  userId: string;
  mode: FollowMode;
}

const hints: KeyHint[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'Enter', action: 'view profile' },
  { key: 'r', action: 'refresh' },
  { key: 'b', action: 'back' },
];

export function Followers({ userId, mode }: FollowersProps) {
  const { push } = useNavigation();
  const { users, loading, error, refresh } = useFollowers(userId, mode);

  useInput((input) => {
    if (input === 'r') refresh();
  });

  const handleUserSelect = (user: User) => {
    push('user', { userId: user.id });
  };

  const title = mode === 'followers' ? 'Followers' : 'Following';

  if (loading && users.length === 0) {
    return (
      <Screen title={title} hints={hints}>
        <Spinner label={`Loading ${mode}...`} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen title={title} hints={hints}>
        <ErrorDisplay message={error} />
      </Screen>
    );
  }

  return (
    <Screen title={title} subtitle={`${users.length} users`} hints={hints}>
      <UserList users={users} onSelect={handleUserSelect} />
    </Screen>
  );
}
