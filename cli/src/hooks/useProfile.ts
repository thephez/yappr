/**
 * useProfile hook - fetch user profile with posts
 */
import { useState, useEffect, useCallback } from 'react';
import type { User, Post } from '../../../lib/types.js';
import { profileService } from '../../../lib/services/profile-service.js';
import { dpnsService } from '../../../lib/services/dpns-service.js';
import { postService } from '../../../lib/services/post-service.js';
import { followService } from '../../../lib/services/follow-service.js';
import { identityService } from '../../../lib/services/identity-service.js';
import { likeService } from '../../../lib/services/like-service.js';
import { useIdentity } from '../store/identity.js';

export interface UseProfileResult {
  user: User | null;
  posts: Post[];
  likedPosts: Post[];
  isFollowing: boolean;
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  loadMoreLikes: () => Promise<void>;
}

export function useProfile(userId?: string, username?: string): UseProfileResult {
  const { identity } = useIdentity();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Resolve user ID from username if needed
      let targetUserId = userId;
      if (!targetUserId && username) {
        const resolved = await dpnsService.resolveIdentity(username);
        if (!resolved) {
          setError(`User @${username} not found`);
          return;
        }
        targetUserId = resolved;
      }

      if (!targetUserId) {
        setError('No user specified');
        return;
      }

      setResolvedUserId(targetUserId);

      // Fetch profile
      const profile = await profileService.getProfileWithUsername(targetUserId);
      if (!profile) {
        setError('Profile not found');
        return;
      }

      setUser(profile);

      // Fetch balance (only for own profile)
      if (identity?.identityId === targetUserId) {
        const identityInfo = await identityService.getIdentity(targetUserId);
        setBalance(identityInfo?.balance ?? null);
      }

      // Check follow status if logged in
      if (identity?.identityId && identity.identityId !== targetUserId) {
        const following = await followService.isFollowing(targetUserId, identity.identityId);
        setIsFollowing(following);
      }

      // Fetch user's posts
      const postsResult = await postService.getUserPosts(targetUserId, { limit: 20 });
      const enrichedPosts = await postService.enrichPostsBatch(postsResult.documents);
      setPosts(enrichedPosts);

      // Fetch liked posts
      const likes = await likeService.getUserLikes(targetUserId, { limit: 20 });
      if (likes.length > 0) {
        const likedPostIds = likes.map((l) => l.postId);
        const likedPostDocs = await postService.getPostsByIds(likedPostIds);
        setLikedPosts(likedPostDocs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, username, identity?.identityId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const loadMorePosts = useCallback(async () => {
    // TODO: implement pagination
  }, []);

  const loadMoreLikes = useCallback(async () => {
    // TODO: implement pagination
  }, []);

  return {
    user,
    posts,
    likedPosts,
    isFollowing,
    balance,
    loading,
    error,
    refresh: fetchProfile,
    loadMorePosts,
    loadMoreLikes,
  };
}
