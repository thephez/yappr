/**
 * Bar chart component
 */

import { createElement, $ } from '../utils/dom.js';
import { formatDateShort } from '../utils/format.js';

/**
 * Calculate nice Y-axis tick values
 */
function getYAxisTicks(maxValue) {
  // Round up to a nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;

  let niceMax;
  if (normalized <= 1) niceMax = magnitude;
  else if (normalized <= 2) niceMax = 2 * magnitude;
  else if (normalized <= 5) niceMax = 5 * magnitude;
  else niceMax = 10 * magnitude;

  // Return 5 tick values (0, 25%, 50%, 75%, 100%)
  return [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax].map(Math.round);
}

/**
 * Render a bar chart for posts or users
 * @param {object} index - The index data
 * @param {'posts' | 'users'} type - Chart type
 * @param {function} onBarClick - Callback when a bar is clicked
 */
export function renderBarChart(index, type, onBarClick) {
  const containerId = type === 'posts' ? '#posts-chart' : '#users-chart';
  const container = $(containerId);
  if (!container) return;

  const title = type === 'posts' ? 'Posts per Day' : 'New Users per Day';
  const dataKey = type === 'posts' ? 'posts' : 'newUsers';
  const barClass = type === 'posts' ? 'chart__bar--posts' : 'chart__bar--users';

  // Get days sorted oldest to newest for chart display
  const days = [...index.days].sort((a, b) => a.date.localeCompare(b.date));

  // Find max value for scaling
  const rawMax = Math.max(...days.map(d => d[dataKey]), 1);
  const yTicks = getYAxisTicks(rawMax);
  const maxValue = yTicks[yTicks.length - 1];

  container.innerHTML = '';

  // Title
  container.appendChild(
    createElement('h3', { className: 'chart__title' }, [title])
  );

  // Chart wrapper (Y-axis + bars)
  const chartWrapper = createElement('div', { className: 'chart__wrapper' });

  // Y-axis
  const yAxis = createElement('div', { className: 'chart__y-axis' });
  for (let i = yTicks.length - 1; i >= 0; i--) {
    yAxis.appendChild(
      createElement('div', { className: 'chart__y-tick' }, [String(yTicks[i])])
    );
  }
  chartWrapper.appendChild(yAxis);

  // Chart area (bars + grid lines)
  const chartArea = createElement('div', { className: 'chart__area' });

  // Grid lines
  const gridLines = createElement('div', { className: 'chart__grid' });
  for (let i = 0; i < yTicks.length; i++) {
    gridLines.appendChild(createElement('div', { className: 'chart__grid-line' }));
  }
  chartArea.appendChild(gridLines);

  // Bars container
  const barsContainer = createElement('div', { className: 'chart__bars' });

  for (const day of days) {
    const value = day[dataKey];
    const heightPercent = (value / maxValue) * 100;

    const barWrapper = createElement('div', {
      className: 'chart__bar-wrapper',
      title: `${formatDateShort(day.date)}: ${value}`,
      onClick: () => onBarClick(day.date),
    }, [
      createElement('div', {
        className: `chart__bar ${barClass}`,
        style: `height: ${heightPercent}%`,
        'aria-label': `${value} ${type === 'posts' ? 'posts' : 'new users'} on ${day.date}`,
      }),
    ]);

    barsContainer.appendChild(barWrapper);
  }

  chartArea.appendChild(barsContainer);
  chartWrapper.appendChild(chartArea);
  container.appendChild(chartWrapper);

  // X-axis labels
  const xAxis = createElement('div', { className: 'chart__x-axis' });
  for (const day of days) {
    xAxis.appendChild(
      createElement('div', { className: 'chart__x-label' }, [
        formatDateShort(day.date).split(' ')[1], // Just the day number
      ])
    );
  }
  container.appendChild(xAxis);
}
