/**
 * Navigation store - manages screen stack and navigation
 */
import { create } from 'zustand';

export type ScreenType =
  | 'timeline'
  | 'post'
  | 'user'
  | 'search'
  | 'followers'
  | 'hashtag'
  | 'settings'
  | 'help';

export interface ScreenState {
  screen: ScreenType;
  params: Record<string, any>;
}

interface NavigationState {
  stack: ScreenState[];
  current: ScreenState;

  // Navigation actions
  push: (screen: ScreenType, params?: Record<string, any>) => void;
  pop: () => boolean;
  replace: (screen: ScreenType, params?: Record<string, any>) => void;
  reset: (screen?: ScreenType, params?: Record<string, any>) => void;

  // Selection state (for lists)
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  moveSelection: (delta: number, maxIndex: number) => void;

  // Tab state (for tabbed views)
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export const useNavigation = create<NavigationState>((set, get) => ({
  stack: [],
  current: { screen: 'timeline', params: {} },
  selectedIndex: 0,
  activeTab: 0,

  push: (screen, params = {}) => {
    const { current, stack } = get();
    set({
      stack: [...stack, current],
      current: { screen, params },
      selectedIndex: 0,
      activeTab: 0,
    });
  },

  pop: () => {
    const { stack } = get();
    if (stack.length === 0) return false;

    const newStack = [...stack];
    const prev = newStack.pop()!;
    set({
      stack: newStack,
      current: prev,
      selectedIndex: 0,
      activeTab: 0,
    });
    return true;
  },

  replace: (screen, params = {}) => {
    set({
      current: { screen, params },
      selectedIndex: 0,
      activeTab: 0,
    });
  },

  reset: (screen = 'timeline', params = {}) => {
    set({
      stack: [],
      current: { screen, params },
      selectedIndex: 0,
      activeTab: 0,
    });
  },

  setSelectedIndex: (index) => {
    set({ selectedIndex: Math.max(0, index) });
  },

  moveSelection: (delta, maxIndex) => {
    const { selectedIndex } = get();
    const newIndex = Math.max(0, Math.min(maxIndex, selectedIndex + delta));
    set({ selectedIndex: newIndex });
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab, selectedIndex: 0 });
  },
}));
