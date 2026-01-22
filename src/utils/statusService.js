/**
 * Status Service Module
 *
 * Provides global functions to fetch and manage case status information.
 * Caches status data to minimize API calls.
 */

import { apiPost } from "./api";

// In-memory cache for statuses
let statusCache = null;
let cacheLoadPromise = null;

/**
 * Fetch all statuses from the backend and cache them
 * @returns {Promise<Array>} Array of status objects
 */
const fetchAndCacheStatuses = async () => {
  try {
    const response = await apiPost("/status/statuses");

    if (response.status === "success" && response.data.statuses) {
      statusCache = response.data.statuses;
      console.log("Status cache updated:", statusCache);
      return statusCache;
    } else {
      console.warn("Failed to fetch statuses:", response.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching statuses:", error);
    return [];
  }
};

/**
 * Get or initialize the status cache
 * Ensures statuses are loaded only once
 * @returns {Promise<Array>} Cached statuses
 */
const getStatusCache = async () => {
  // If cache is already loaded, return it
  if (statusCache !== null) {
    return statusCache;
  }

  // If a fetch is already in progress, wait for it
  if (cacheLoadPromise) {
    return cacheLoadPromise;
  }

  // Start fetching and cache the promise
  cacheLoadPromise = fetchAndCacheStatuses();
  const result = await cacheLoadPromise;
  cacheLoadPromise = null;

  return result;
};

/**
 * Get status information by Status ID
 * @param {number} statusId - The Status_ID to look up
 * @returns {Promise<Object|null>} Status object or null if not found
 */
export const getStatusById = async (statusId) => {
  const statuses = await getStatusCache();
  return statuses.find((status) => status.Status_ID === statusId) || null;
};

/**
 * Get status name/label by Status ID
 * @param {number} statusId - The Status_ID to look up
 * @returns {Promise<string>} Status name or "Unknown" if not found
 */
export const getStatusNameById = async (statusId) => {
  const status = await getStatusById(statusId);
  return status ? status.Status_Streamline_Options : "Unknown";
};

/**
 * Get all cached statuses
 * @returns {Promise<Array>} All status objects
 */
export const getAllStatuses = async () => {
  return getStatusCache();
};

/**
 * Manually refresh the status cache
 * Useful if statuses change and need to be reloaded
 * @returns {Promise<Array>} Updated statuses
 */
export const refreshStatusCache = async () => {
  statusCache = null;
  return fetchAndCacheStatuses();
};

/**
 * Initialize status cache on app load
 * Call this in your App.js useEffect
 */
export const initializeStatusCache = async () => {
  try {
    await getStatusCache();
  } catch (error) {
    console.error("Failed to initialize status cache:", error);
  }
};

export default {
  getStatusById,
  getStatusNameById,
  getAllStatuses,
  refreshStatusCache,
  initializeStatusCache,
};
