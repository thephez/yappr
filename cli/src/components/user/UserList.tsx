/**
 * UserList component - scrollable list of users
 */
import React from 'react';
import type { User } from '../../../lib/types.js';
import { ScrollList } from '../common/ScrollList.js';
import { UserCard } from './UserCard.js';
import { Empty } from '../common/Empty.js';

export interface UserListProps {
  users: User[];
  onSelect?: (user: User) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  height?: number;
  showFollowStatus?: boolean;
  followingIds?: Set<string>;
}

export function UserList({
  users,
  onSelect,
  onLoadMore,
  hasMore,
  height,
  showFollowStatus,
  followingIds,
}: UserListProps) {
  if (users.length === 0) {
    return <Empty message="No users found" />;
  }

  return (
    <ScrollList
      items={users}
      height={height}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      onSelect={(user) => onSelect?.(user)}
      renderItem={(user, index, isSelected) => (
        <UserCard
          user={user}
          selected={isSelected}
          showFollowStatus={showFollowStatus}
          isFollowing={followingIds?.has(user.id)}
        />
      )}
    />
  );
}
