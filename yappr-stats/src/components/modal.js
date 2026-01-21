/**
 * Modal component for day drill-down
 */

import { $, $$, show, hide, clearChildren } from '../utils/dom.js';
import { loadDay, getSortedDates, getUserDisplayName } from '../utils/data.js';
import { formatDate, formatTime, escapeHtml, truncate } from '../utils/format.js';

let currentDate = null;
let currentTab = 'posts';
let sortedDates = [];

/**
 * Initialize the modal with event listeners
 */
export function initModal(index) {
  sortedDates = getSortedDates(index);

  const modal = $('#modal');
  const backdrop = $('.modal__backdrop', modal);
  const closeBtn = $('.modal__close', modal);
  const prevBtn = $('.modal__nav--prev', modal);
  const nextBtn = $('.modal__nav--next', modal);
  const tabs = $$('.modal__tab', modal);

  // Close on backdrop click
  backdrop.addEventListener('click', closeModal);

  // Close button
  closeBtn.addEventListener('click', closeModal);

  // Navigation (left = older/back in time, right = newer/forward in time)
  // sortedDates is newest-first, so +1 goes older, -1 goes newer
  prevBtn.addEventListener('click', () => navigateDay(1));
  nextBtn.addEventListener('click', () => navigateDay(-1));

  // Tab switching
  for (const tab of tabs) {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleKeydown);
}

/**
 * Open the modal for a specific date
 */
export async function openModal(date, tab = 'posts') {
  currentDate = date;
  currentTab = tab;

  const modal = $('#modal');
  const title = $('#modal-title');
  const loading = $('.modal__loading', modal);

  // Update title
  title.textContent = formatDate(date);

  // Show modal
  show(modal);
  show(loading);

  // Update navigation buttons
  updateNavButtons();

  // Update tab state
  switchTab(tab, false);

  // Load and render day data
  try {
    const dayData = await loadDay(date);
    hide(loading);
    renderDayContent(dayData);
  } catch (error) {
    loading.textContent = `Error loading data: ${error.message}`;
  }
}

/**
 * Close the modal
 */
export function closeModal() {
  const modal = $('#modal');
  hide(modal);
  currentDate = null;
}

/**
 * Navigate to previous or next day
 */
function navigateDay(direction) {
  const currentIndex = sortedDates.indexOf(currentDate);
  const newIndex = currentIndex + direction;

  if (newIndex >= 0 && newIndex < sortedDates.length) {
    openModal(sortedDates[newIndex], currentTab);
  }
}

/**
 * Update navigation button states
 * sortedDates is newest-first, so:
 * - prev (left/older) is disabled at the end of the array (oldest date)
 * - next (right/newer) is disabled at index 0 (newest date)
 */
function updateNavButtons() {
  const prevBtn = $('.modal__nav--prev');
  const nextBtn = $('.modal__nav--next');

  const currentIndex = sortedDates.indexOf(currentDate);

  prevBtn.disabled = currentIndex >= sortedDates.length - 1; // Can't go older
  nextBtn.disabled = currentIndex <= 0; // Can't go newer
}

/**
 * Switch between posts and users tabs
 */
function switchTab(tab, render = true) {
  currentTab = tab;

  const tabs = $$('.modal__tab');
  for (const tabEl of tabs) {
    const isActive = tabEl.dataset.tab === tab;
    tabEl.classList.toggle('modal__tab--active', isActive);
    tabEl.setAttribute('aria-selected', isActive);
  }

  // Show/hide panels
  const postsPanel = $('#modal-posts');
  const usersPanel = $('#modal-users');

  if (tab === 'posts') {
    show(postsPanel);
    hide(usersPanel);
  } else {
    hide(postsPanel);
    show(usersPanel);
  }

  // Re-render if content is already loaded and render flag is true
  if (render && currentDate) {
    loadDay(currentDate).then(renderDayContent);
  }
}

/**
 * Render the content for a day
 */
function renderDayContent(dayData) {
  renderPostsPanel(dayData.posts || []);
  renderUsersPanel(dayData.users || []);
}

/**
 * Render the posts panel
 */
function renderPostsPanel(posts) {
  const panel = $('#modal-posts');
  clearChildren(panel);

  if (posts.length === 0) {
    panel.innerHTML = '<div class="modal__empty">No posts on this day</div>';
    return;
  }

  for (const post of posts) {
    const link = document.createElement('a');
    link.href = `https://yap.pr/post/?id=${post.id}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'modal__item';

    // Try to get display name, fall back to truncated owner ID
    const displayName = getUserDisplayName(post.ownerId);
    const authorText = displayName || truncate(post.ownerId, 12);

    link.innerHTML = `
      <div class="modal__item-time">${formatTime(post.createdAt)} UTC</div>
      <div class="modal__item-content">${escapeHtml(post.content)}</div>
      <div class="modal__item-author">${escapeHtml(authorText)}</div>
    `;

    panel.appendChild(link);
  }
}

/**
 * Render the users panel
 */
function renderUsersPanel(users) {
  const panel = $('#modal-users');
  clearChildren(panel);

  if (users.length === 0) {
    panel.innerHTML = '<div class="modal__empty">No new users on this day</div>';
    return;
  }

  for (const user of users) {
    const link = document.createElement('a');
    link.href = `https://yap.pr/user/?id=${user.ownerId}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'modal__item';

    const displayName = user.displayName || 'Anonymous';

    link.innerHTML = `
      <div class="modal__item-time">${formatTime(user.createdAt)} UTC</div>
      <div class="modal__item-name">${escapeHtml(displayName)}</div>
      <div class="modal__item-id">${truncate(user.ownerId, 12)}</div>
    `;

    panel.appendChild(link);
  }
}

/**
 * Handle keyboard events
 */
function handleKeydown(event) {
  const modal = $('#modal');
  if (modal.hidden) return;

  switch (event.key) {
    case 'Escape':
      closeModal();
      break;
    case 'ArrowLeft':
      navigateDay(1); // Go older (higher index in newest-first array)
      break;
    case 'ArrowRight':
      navigateDay(-1); // Go newer (lower index in newest-first array)
      break;
  }
}
