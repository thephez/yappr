/**
 * Summary cards component
 */

import { createElement, $ } from '../utils/dom.js';
import { formatNumber } from '../utils/format.js';

/**
 * Render summary cards with totals
 */
export function renderSummaryCards(index) {
  const container = $('#summary-cards');
  if (!container) return;

  const { totals } = index;

  const cards = [
    { value: totals.posts, label: 'Total Posts', modifier: 'posts' },
    { value: totals.uniquePosters, label: 'Users Who Posted', modifier: 'posters' },
    { value: totals.users, label: 'Total Users', modifier: 'users' },
  ];

  container.innerHTML = '';

  for (const card of cards) {
    const cardEl = createElement('div', { className: 'summary-card' }, [
      createElement('div', {
        className: `summary-card__value summary-card__value--${card.modifier}`,
      }, [formatNumber(card.value)]),
      createElement('div', { className: 'summary-card__label' }, [card.label]),
    ]);
    container.appendChild(cardEl);
  }
}
