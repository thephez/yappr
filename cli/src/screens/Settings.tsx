/**
 * Settings screen - identity management
 */
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Screen, type KeyHint } from '../components/layout/index.js';
import { Spinner } from '../components/common/index.js';
import { useIdentity } from '../store/identity.js';
import { useNavigation } from '../store/navigation.js';
import { styled, horizontalLine } from '../utils/colors.js';
import { formatCredits } from '../utils/format.js';
import { getContentWidth } from '../utils/terminal.js';

const hints: KeyHint[] = [
  { key: 'Enter', action: 'confirm' },
  { key: 'c', action: 'clear identity' },
  { key: 'Esc', action: 'back' },
];

export function Settings() {
  const { pop } = useNavigation();
  const { identity, loading, error, setIdentity, clearIdentity, refreshIdentity } = useIdentity();

  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(!identity);
  const [localError, setLocalError] = useState<string | null>(null);

  const width = getContentWidth();

  useInput((input, key) => {
    if (input === 'c' && identity && !isEditing) {
      clearIdentity();
      setIsEditing(true);
      setInputValue('');
    }
    if (input === 'r' && identity && !isEditing) {
      refreshIdentity();
    }
    if (key.return && isEditing && inputValue.length > 10) {
      handleSetIdentity();
    }
  });

  const handleSetIdentity = async () => {
    setLocalError(null);
    try {
      await setIdentity(inputValue.trim());
      setIsEditing(false);
      setInputValue('');
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to set identity');
    }
  };

  return (
    <Screen title="Settings" subtitle="Identity" hints={hints}>
      <Box flexDirection="column" paddingX={1}>
        <Text bold>Identity Configuration</Text>
        <Text>{horizontalLine(width - 2)}</Text>

        {loading ? (
          <Spinner label="Verifying identity..." />
        ) : identity ? (
          // Show current identity
          <Box flexDirection="column" marginTop={1}>
            <Box>
              <Text dimColor>Status: </Text>
              <Text color="green">Connected</Text>
            </Box>

            <Box marginTop={1}>
              <Text dimColor>Identity ID:</Text>
            </Box>
            <Text>{identity.identityId}</Text>

            {identity.username && (
              <Box marginTop={1}>
                <Text dimColor>Username: </Text>
                <Text>{styled.username(identity.username)}</Text>
              </Box>
            )}

            {identity.balance !== undefined && (
              <Box marginTop={1}>
                <Text dimColor>Balance: </Text>
                <Text>{formatCredits(identity.balance)}</Text>
              </Box>
            )}

            <Box marginTop={2}>
              <Text dimColor>
                Press <Text bold>c</Text> to clear identity, <Text bold>r</Text> to refresh
              </Text>
            </Box>
          </Box>
        ) : (
          // Show input for identity
          <Box flexDirection="column" marginTop={1}>
            <Box>
              <Text dimColor>Status: </Text>
              <Text color="yellow">Not connected</Text>
            </Box>

            <Box marginTop={1}>
              <Text>Enter your Identity ID to view personalized content.</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>
                Your identity ID is a base58 string (e.g., 5DbLwAx...).
                This is read-only - no private key needed.
              </Text>
            </Box>

            <Box marginTop={2}>
              <Text color="cyan">Identity ID: </Text>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                placeholder="Enter your identity ID..."
              />
            </Box>

            {(localError || error) && (
              <Box marginTop={1}>
                <Text color="red">{localError || error}</Text>
              </Box>
            )}

            <Box marginTop={2}>
              <Text dimColor>Press Enter to connect</Text>
            </Box>
          </Box>
        )}

        {/* Info section */}
        <Box marginTop={3} flexDirection="column">
          <Text>{horizontalLine(width - 2)}</Text>
          <Text dimColor>About Identity Mode</Text>
          <Text dimColor>
            Setting your identity allows you to:
          </Text>
          <Text dimColor>  - See your following feed</Text>
          <Text dimColor>  - View your interactions (likes, reposts)</Text>
          <Text dimColor>  - See your profile and balance</Text>
          <Text> </Text>
          <Text dimColor>
            This is read-only. No private key is stored or required.
          </Text>
        </Box>
      </Box>
    </Screen>
  );
}
