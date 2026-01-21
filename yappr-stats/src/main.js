/**
 * Yappr Stats - Main entry point
 */

import { loadIndex, preloadAllDays } from './utils/data.js';
import { renderSummaryCards } from './components/summary-cards.js';
import { renderBarChart } from './components/bar-chart.js';
import { renderDataTable } from './components/data-table.js';
import { initModal, openModal } from './components/modal.js';

/**
 * Handle click on a day from posts chart or table
 */
function handlePostsClick(date) {
  openModal(date, 'posts');
}

/**
 * Handle click on a day from users chart
 */
function handleUsersClick(date) {
  openModal(date, 'users');
}

/**
 * Initialize the application
 */
async function init() {
  try {
    // Load index data
    const index = await loadIndex();

    // Render all components
    renderSummaryCards(index);
    renderBarChart(index, 'posts', handlePostsClick);
    renderBarChart(index, 'users', handleUsersClick);
    renderDataTable(index, handlePostsClick);

    // Initialize modal
    initModal(index);

    // Preload all days in background to build user lookup for profile names
    preloadAllDays(index);

    console.log('Yappr Stats loaded:', {
      days: index.days.length,
      posts: index.totals.posts,
      users: index.totals.users,
    });
  } catch (error) {
    console.error('Failed to initialize Yappr Stats:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #f87171;">
        <h2>Failed to load statistics</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Start the app
init();
