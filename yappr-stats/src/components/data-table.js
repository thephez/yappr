/**
 * Data table component
 */

import { createElement, $ } from '../utils/dom.js';
import { formatDate, formatISODate, formatNumber } from '../utils/format.js';

/**
 * Render the statistics data table
 * @param {object} index - The index data
 * @param {function} onRowClick - Callback when a row is clicked
 */
export function renderDataTable(index, onRowClick) {
  const container = $('#data-table-section');
  if (!container) return;

  // Sort days newest first
  const days = [...index.days].sort((a, b) => b.date.localeCompare(a.date));

  container.innerHTML = '';

  const table = createElement('table', { className: 'data-table' });

  // Header
  const thead = createElement('thead');
  thead.appendChild(
    createElement('tr', {}, [
      createElement('th', {}, ['Date']),
      createElement('th', {}, ['Posts']),
      createElement('th', {}, ['New Users']),
    ])
  );
  table.appendChild(thead);

  // Body
  const tbody = createElement('tbody');

  for (const day of days) {
    const row = createElement('tr', {
      onClick: () => onRowClick(day.date),
    }, [
      createElement('td', { className: 'data-table__date' }, [formatDate(day.date)]),
      createElement('td', { className: 'data-table__posts' }, [formatNumber(day.posts)]),
      createElement('td', { className: 'data-table__users' }, [formatNumber(day.newUsers)]),
    ]);
    tbody.appendChild(row);
  }

  // Total row
  const totalRow = createElement('tr', { className: 'data-table__total' }, [
    createElement('td', {}, ['Total']),
    createElement('td', { className: 'data-table__posts' }, [formatNumber(index.totals.posts)]),
    createElement('td', { className: 'data-table__users' }, [formatNumber(index.totals.users)]),
  ]);
  tbody.appendChild(totalRow);

  table.appendChild(tbody);
  container.appendChild(table);
}
