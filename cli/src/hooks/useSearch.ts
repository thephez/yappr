/**
 * useSearch hook - search for users
 */
import { useState, useCallback } from 'react';
import type { User } from '../../../lib/types.js';
import { dpnsService } from '../../../lib/services/dpns-service.js';
import { profileService } from '../../../lib/services/profile-service.js';

export interface UseSearchResult {
  results: User[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search usernames via DPNS
      const searchResults = await dpnsService.searchUsernamesWithDetails(query, 20);

      if (searchResults.length === 0) {
        setResults([]);
        return;
      }

      // Fetch profiles for the found users
      const userIds = searchResults.map((r) => r.ownerId);
      const profiles = await profileService.getProfilesByIdentityIds(userIds);

      // Map to User objects
      const users: User[] = searchResults.map((result) => {
        const profile = profiles.find((p) => p.$ownerId === result.ownerId);
        return {
          id: result.ownerId,
          username: result.username,
          displayName: profile?.displayName || result.username,
          avatar: '', // Would be generated from ID
          bio: profile?.bio,
          followers: 0, // Would need separate fetch
          following: 0,
          joinedAt: new Date(),
        };
      });

      setResults(users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
