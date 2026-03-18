/**
 * UserCard component - compact user display for lists
 */
import React from 'react';
import { Box, Text } from 'ink';
import type { User } from '../../../lib/types.js';
import { styled, colors } from '../../utils/colors.js';
import { truncate, formatNumber } from '../../utils/format.js';

export interface UserCardProps {
  user: User;
  selected?: boolean;
  showFollowStatus?: boolean;
  isFollowing?: boolean;
}

export function UserCard({ user, selected, showFollowStatus, isFollowing }: UserCardProps) {
  const indicator = selected ? colors.primary('\u25b6 ') : '  ';

  return (
    <Box
      flexDirection="column"
      paddingX={1}
      borderStyle={selected ? 'single' : undefined}
      borderColor={selected ? 'cyan' : undefined}
    >
      {/* Name and username */}
      <Box>
        <Text>{indicator}</Text>
        <Text>{styled.displayName(truncate(user.displayName || user.username, 25))} </Text>
        <Text>{styled.username(user.username || user.id.slice(0, 8))}</Text>
        {showFollowStatus && isFollowing && (
          <Text color="green"> \u2713 Following</Text>
        )}
      </Box>

      {/* Bio */}
      {user.bio && (
        <Box marginLeft={2}>
          <Text dimColor>{truncate(user.bio, 60)}</Text>
        </Box>
      )}

      {/* Stats */}
      <Box marginLeft={2} gap={2}>
        <Text dimColor>
          <Text bold>{formatNumber(user.followers)}</Text> followers
        </Text>
        <Text dimColor>
          <Text bold>{formatNumber(user.following)}</Text> following
        </Text>
      </Box>

      {/* Spacing */}
      <Text> </Text>
    </Box>
  );
}
