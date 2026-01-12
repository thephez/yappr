/**
 * ScrollList component - scrollable list with keyboard navigation
 */
import React, { useEffect, type ReactNode } from 'react';
import { Box, useInput } from 'ink';
import { useNavigation } from '../../store/navigation.js';
import { getContentHeight } from '../../utils/terminal.js';

export interface ScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isSelected: boolean) => ReactNode;
  onSelect?: (item: T, index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  height?: number;
  emptyMessage?: string;
}

export function ScrollList<T>({
  items,
  renderItem,
  onSelect,
  onLoadMore,
  hasMore,
  height,
}: ScrollListProps<T>) {
  const { selectedIndex, setSelectedIndex, moveSelection } = useNavigation();

  // Calculate visible window
  const listHeight = height ?? getContentHeight(4, 2);
  const itemHeight = 4; // Approximate lines per item
  const visibleItems = Math.floor(listHeight / itemHeight);

  // Calculate scroll offset
  const scrollOffset = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(visibleItems / 2), items.length - visibleItems)
  );

  // Keyboard navigation
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      moveSelection(-1, items.length - 1);
    } else if (key.downArrow || input === 'j') {
      moveSelection(1, items.length - 1);
    } else if (key.return && items[selectedIndex]) {
      onSelect?.(items[selectedIndex], selectedIndex);
    }
  });

  // Load more when near end
  useEffect(() => {
    if (hasMore && selectedIndex >= items.length - 3) {
      onLoadMore?.();
    }
  }, [selectedIndex, items.length, hasMore]);

  // Reset selection if items change significantly
  useEffect(() => {
    if (selectedIndex >= items.length && items.length > 0) {
      setSelectedIndex(items.length - 1);
    }
  }, [items.length]);

  // Get visible items
  const visibleRange = items.slice(scrollOffset, scrollOffset + visibleItems + 2);

  return (
    <Box flexDirection="column" overflow="hidden">
      {visibleRange.map((item, i) => {
        const actualIndex = scrollOffset + i;
        const isSelected = actualIndex === selectedIndex;
        return (
          <Box key={actualIndex}>
            {renderItem(item, actualIndex, isSelected)}
          </Box>
        );
      })}
    </Box>
  );
}
