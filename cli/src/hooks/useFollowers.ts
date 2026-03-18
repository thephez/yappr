/**
 * useFollowers hook - fetch followers or following list
 */
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../../../lib/types.js';
import { followService } from '../../../lib/services/follow-service.js';
import { profileService } from '../../../lib/services/profile-service.js';
import { dpnsService } from '../../../lib/services/dpns-service.js';

export type FollowMode = 'followers' | 'following';

export interface UseFollowersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFollowers(userId: string, mode: FollowMode): UseFollowersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let documents;

      if (mode === 'followers') {
        documents = await followService.getFollowers(userId, { limit: 100 });
      } else {
        documents = await followService.getFollowing(userId, { limit: 100 });
      }

      if (documents.length === 0) {
        setUsers([]);
        return;
      }

      // Extract user IDs
      const userIds = mode === 'followers'
        ? documents.map((d) => d.$ownerId)
        : documents.map((d) => d.followingId);

      // Fetch profiles
      const profiles = await profileService.getProfilesByIdentityIds(userIds);

      // Fetch usernames
      const usernames = await dpnsService.resolveUsernamesBatch(userIds);

      // Build user objects
      const fetchedUsers: User[] = userIds.map((id) => {
        const profile = profiles.find((p) => p.$ownerId === id);
        const username = usernames.get(id);

        return {
          id,
          username: username || id.slice(0, 8),
          displayName: profile?.displayName || username || id.slice(0, 8),
          avatar: '',
          bio: profile?.bio,
          followers: 0,
          following: 0,
          joinedAt: new Date(),
        };
      });

      setUsers(fetchedUsers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [userId, mode]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refresh: fetchUsers };
}
