/**
 * DOM helper utilities
 */

/**
 * Create an element with attributes and children
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Shorthand for querySelector
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand for querySelectorAll
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Clear all children from an element
 */
export function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Show an element (remove hidden attribute)
 */
export function show(el) {
  el.hidden = false;
}

/**
 * Hide an element (add hidden attribute)
 */
export function hide(el) {
  el.hidden = true;
}
