/**
 * PostCard component - compact post display for lists
 */
import React from 'react';
import { Box, Text } from 'ink';
import type { Post } from '../../../lib/types.js';
import { styled, colors } from '../../utils/colors.js';
import { truncate, shortRelativeTime, formatNumber, wrapText } from '../../utils/format.js';
import { getContentWidth } from '../../utils/terminal.js';

export interface PostCardProps {
  post: Post;
  selected?: boolean;
  showReplyTo?: boolean;
}

export function PostCard({ post, selected, showReplyTo }: PostCardProps) {
  const width = getContentWidth();
  const contentWidth = width - 4; // Padding and selection indicator

  // Wrap content to fit width
  const contentLines = wrapText(post.content, contentWidth);
  const displayContent = contentLines.slice(0, 3); // Max 3 lines
  const truncated = contentLines.length > 3;

  // Format stats
  const stats = [
    styled.likes(post.likes, post.liked),
    styled.reposts(post.reposts, post.reposted),
    styled.replies(post.replies),
  ].join('  ');

  // Author info
  const author = post.author;
  const authorName = author.displayName || author.username || 'Unknown';
  const authorUsername = author.username || author.id.slice(0, 8);

  // Selection indicator
  const indicator = selected ? colors.primary('\u25b6 ') : '  ';

  return (
    <Box
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      borderStyle={selected ? 'single' : undefined}
      borderColor={selected ? 'cyan' : undefined}
    >
      {/* Reply indicator */}
      {showReplyTo && post.replyToId && (
        <Text dimColor>  \u2514\u2500 replying to post</Text>
      )}

      {/* Repost indicator */}
      {post.repostedBy && (
        <Text dimColor>  \u21bb Reposted by {post.repostedBy.displayName || post.repostedBy.username}</Text>
      )}

      {/* Header: author and time */}
      <Box>
        <Text>{indicator}</Text>
        <Text>{styled.displayName(truncate(authorName, 20))} </Text>
        <Text>{styled.username(authorUsername)} </Text>
        <Text>{styled.timestamp('\u00b7 ' + shortRelativeTime(post.createdAt))}</Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" marginLeft={2}>
        {displayContent.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
        {truncated && <Text dimColor>...</Text>}
      </Box>

      {/* Media indicator */}
      {post.media && post.media.length > 0 && (
        <Box marginLeft={2}>
          <Text dimColor>[{post.media[0].type}]</Text>
        </Box>
      )}

      {/* Quote indicator */}
      {post.quotedPostId && (
        <Box marginLeft={2}>
          <Text dimColor>\u250c Quote \u2510</Text>
        </Box>
      )}

      {/* Stats */}
      <Box marginLeft={2}>
        <Text>{stats}</Text>
        {post.bookmarked && <Text color="yellow">  \u2605</Text>}
      </Box>

      {/* Spacing */}
      <Text> </Text>
    </Box>
  );
}
