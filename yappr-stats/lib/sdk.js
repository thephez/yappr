/**
 * SDK initialization helper for Yappr stats collector.
 * Connects to Dash Platform testnet in trusted mode.
 */

import { EvoSDK } from '@dashevo/evo-sdk';

let sdk = null;

/**
 * Get or create the SDK instance
 */
export async function getSdk() {
  if (sdk) {
    return sdk;
  }

  console.log('Initializing EvoSDK in testnet trusted mode...');
  sdk = EvoSDK.testnetTrusted({
    settings: {
      timeoutMs: 15000,
    }
  });

  console.log('Connecting to Dash Platform...');
  await sdk.connect();
  console.log('Connected successfully');

  return sdk;
}

/**
 * Cleanup SDK connection
 */
export async function cleanup() {
  sdk = null;
}

/**
 * Normalize SDK response to array of document objects
 */
export function normalizeSDKResponse(response) {
  if (!response) return [];

  // Handle Map response (v3 SDK primary format)
  if (response instanceof Map) {
    return Array.from(response.values())
      .filter(Boolean)
      .map((doc) => {
        return typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
      });
  }

  // Handle Array response
  if (Array.isArray(response)) {
    return response;
  }

  // Handle object with documents property
  if (response.documents && Array.isArray(response.documents)) {
    return response.documents;
  }

  return [];
}

/**
 * Paginate through documents and collect them
 * @param {object} sdk - The EvoSDK instance
 * @param {function} queryBuilder - Function that returns query object
 * @param {object} options - Options: maxResults, pageSize
 * @param {function} filterFn - Optional filter function to include only matching docs
 * @returns {object} { documents: array, count: number, reachedLimit: boolean }
 */
export async function paginateFetch(sdk, queryBuilder, options = {}, filterFn = null) {
  const { maxResults = 10000, pageSize = 100 } = options;

  const allDocuments = [];
  let startAfter = undefined;
  let reachedLimit = false;

  while (allDocuments.length < maxResults) {
    const query = queryBuilder(startAfter);
    query.limit = pageSize;
    if (startAfter) {
      query.startAfter = startAfter;
    }

    const response = await sdk.documents.query(query);
    const documents = normalizeSDKResponse(response);

    // Collect documents (with optional filter)
    if (filterFn) {
      allDocuments.push(...documents.filter(filterFn));
    } else {
      allDocuments.push(...documents);
    }

    // Check if we've reached the end
    if (documents.length < pageSize) {
      break;
    }

    // Check if we've hit the safety limit
    if (allDocuments.length >= maxResults) {
      reachedLimit = true;
      break;
    }

    // Get cursor for next page
    const lastDoc = documents[documents.length - 1];
    if (!lastDoc.$id) break;
    startAfter = lastDoc.$id;
  }

  return { documents: allDocuments, count: allDocuments.length, reachedLimit };
}

/**
 * Paginate through documents and count them (legacy, calls paginateFetch)
 * @param {object} sdk - The EvoSDK instance
 * @param {function} queryBuilder - Function that returns query object
 * @param {object} options - Options: maxResults, pageSize
 * @param {function} filterFn - Optional filter function to count only matching docs
 */
export async function paginateCount(sdk, queryBuilder, options = {}, filterFn = null) {
  const result = await paginateFetch(sdk, queryBuilder, options, filterFn);
  return { count: result.count, reachedLimit: result.reachedLimit };
}
