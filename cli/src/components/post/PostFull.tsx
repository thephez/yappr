/**
 * PostFull component - expanded post view with full content
 */
import React from 'react';
import { Box, Text } from 'ink';
import type { Post } from '../../../lib/types.js';
import { styled, colors, horizontalLine } from '../../utils/colors.js';
import { wrapText, relativeTime, formatNumber } from '../../utils/format.js';
import { getContentWidth } from '../../utils/terminal.js';

export interface PostFullProps {
  post: Post;
}

export function PostFull({ post }: PostFullProps) {
  const width = getContentWidth();
  const contentWidth = width - 2;

  // Wrap content to fit width
  const contentLines = wrapText(post.content, contentWidth);

  // Author info
  const author = post.author;
  const authorName = author.displayName || author.username || 'Unknown';
  const authorUsername = author.username || author.id.slice(0, 8);

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Author header */}
      <Box marginBottom={1}>
        <Text>{styled.displayName(authorName)}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text>{styled.username(authorUsername)}</Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" marginBottom={1}>
        {contentLines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <Box marginBottom={1}>
          <Text dimColor>[{post.media[0].type}: {post.media[0].url}]</Text>
        </Box>
      )}

      {/* Quoted post indicator */}
      {post.quotedPost && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          marginBottom={1}
        >
          <Box>
            <Text dimColor>
              {post.quotedPost.author.displayName || post.quotedPost.author.username}
            </Text>
            <Text dimColor> {styled.username(post.quotedPost.author.username || '')}</Text>
          </Box>
          <Text dimColor>{post.quotedPost.content.slice(0, 100)}</Text>
        </Box>
      )}

      {/* Timestamp */}
      <Box marginBottom={1}>
        <Text dimColor>{relativeTime(post.createdAt)}</Text>
      </Box>

      {/* Stats bar */}
      <Text>{horizontalLine(width - 2)}</Text>
      <Box gap={3} marginY={1}>
        <Text>
          <Text bold>{formatNumber(post.likes)}</Text>
          <Text dimColor> Likes</Text>
        </Text>
        <Text>
          <Text bold>{formatNumber(post.reposts)}</Text>
          <Text dimColor> Reposts</Text>
        </Text>
        <Text>
          <Text bold>{formatNumber(post.replies)}</Text>
          <Text dimColor> Replies</Text>
        </Text>
      </Box>
      <Text>{horizontalLine(width - 2)}</Text>

      {/* Interaction indicators */}
      <Box gap={2} marginTop={1}>
        {post.liked && <Text color="red">\u2665 Liked</Text>}
        {post.reposted && <Text color="green">\u21bb Reposted</Text>}
        {post.bookmarked && <Text color="yellow">\u2605 Bookmarked</Text>}
      </Box>
    </Box>
  );
}
