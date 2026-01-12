/**
 * Search screen - search for users
 */
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Screen, type KeyHint } from '../components/layout/index.js';
import { UserList } from '../components/user/index.js';
import { Spinner, Empty } from '../components/common/index.js';
import { useSearch } from '../hooks/useSearch.js';
import { useNavigation } from '../store/navigation.js';
import type { User } from '../../../lib/types.js';

export interface SearchProps {
  initialQuery?: string;
}

const hints: KeyHint[] = [
  { key: 'Enter', action: 'search/select' },
  { key: 'j/k', action: 'navigate results' },
  { key: 'Esc', action: 'back' },
];

export function Search({ initialQuery = '' }: SearchProps) {
  const { push, pop, setSelectedIndex } = useNavigation();
  const { results, loading, error, search, clear } = useSearch();

  const [query, setQuery] = useState(initialQuery);
  const [isEditing, setIsEditing] = useState(true);

  // Search on initial query
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
      setIsEditing(false);
    }
  }, []);

  // Keyboard handling
  useInput((input, key) => {
    if (isEditing) {
      if (key.return && query.length >= 2) {
        search(query);
        setIsEditing(false);
        setSelectedIndex(0);
      }
    } else {
      // Not editing - navigate results
      if (input === '/') {
        setIsEditing(true);
      }
    }
  });

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleUserSelect = (user: User) => {
    push('user', { userId: user.id });
  };

  return (
    <Screen title="Search" subtitle="Find users" hints={hints}>
      <Box flexDirection="column">
        {/* Search input */}
        <Box paddingX={1} marginBottom={1}>
          <Text color="cyan">Search: </Text>
          {isEditing ? (
            <TextInput
              value={query}
              onChange={handleQueryChange}
              placeholder="Enter username..."
            />
          ) : (
            <Text>
              {query}
              <Text dimColor> (press / to edit)</Text>
            </Text>
          )}
        </Box>

        {/* Results */}
        {loading ? (
          <Spinner label="Searching..." />
        ) : error ? (
          <Box paddingX={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : results.length === 0 && query.length >= 2 ? (
          <Empty message="No users found" hint={`No results for "${query}"`} />
        ) : results.length > 0 ? (
          <UserList users={results} onSelect={handleUserSelect} />
        ) : (
          <Empty message="Search for users" hint="Type a username and press Enter" />
        )}
      </Box>
    </Screen>
  );
}
