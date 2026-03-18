/**
 * ProfileHeader component - full profile display
 */
import React from 'react';
import { Box, Text } from 'ink';
import type { User } from '../../../lib/types.js';
import { styled, horizontalLine } from '../../utils/colors.js';
import { formatNumber, formatCredits, wrapText } from '../../utils/format.js';
import { getContentWidth } from '../../utils/terminal.js';

export interface ProfileHeaderProps {
  user: User;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  balance?: number;
}

export function ProfileHeader({ user, isFollowing, isOwnProfile, balance }: ProfileHeaderProps) {
  const width = getContentWidth();

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Display name and username */}
      <Box>
        <Text>{styled.displayName(user.displayName || user.username)}</Text>
        {user.verified && <Text color="cyan"> \u2713</Text>}
      </Box>
      <Box marginBottom={1}>
        <Text>{styled.username(user.username || user.id.slice(0, 8))}</Text>
        {isOwnProfile && <Text dimColor> (you)</Text>}
        {!isOwnProfile && isFollowing && <Text color="green"> Following</Text>}
      </Box>

      {/* Bio */}
      {user.bio && (
        <Box flexDirection="column" marginBottom={1}>
          {wrapText(user.bio, width - 2).map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      )}

      {/* Location and website */}
      <Box gap={3} marginBottom={1}>
        {user.location && (
          <Text dimColor>@ {user.location}</Text>
        )}
        {user.website && (
          <Text dimColor>~ {user.website}</Text>
        )}
        {user.pronouns && (
          <Text dimColor>{user.pronouns}</Text>
        )}
      </Box>

      {/* Social links */}
      {user.socialLinks && user.socialLinks.length > 0 && (
        <Box gap={2} marginBottom={1}>
          {user.socialLinks.map((link, i) => (
            <Text key={i} dimColor>
              {link.platform}: {link.handle}
            </Text>
          ))}
        </Box>
      )}

      {/* Stats */}
      <Text>{horizontalLine(width - 2)}</Text>
      <Box gap={3} marginY={1}>
        <Text>
          <Text bold>{formatNumber(user.followers)}</Text>
          <Text dimColor> Followers</Text>
        </Text>
        <Text>
          <Text bold>{formatNumber(user.following)}</Text>
          <Text dimColor> Following</Text>
        </Text>
        {balance !== undefined && (
          <Text>
            <Text bold>{formatCredits(balance)}</Text>
          </Text>
        )}
      </Box>
      <Text>{horizontalLine(width - 2)}</Text>

      {/* Payment URIs */}
      {user.paymentUris && user.paymentUris.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Payment:</Text>
          {user.paymentUris.map((uri, i) => (
            <Text key={i} dimColor>
              {uri.label || uri.scheme}: {uri.uri}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
