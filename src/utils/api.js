/**
 * API Utility Module
 *
 * Provides a centralized, modular approach to making authenticated API requests.
 * Automatically includes JWT token in Authorization header.
 * Handles errors and token expiration consistently across the application.
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Get the stored JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

/**
 * Build headers with authentication
 * Includes JWT token in Authorization header if available
 * @param {Object} customHeaders - Additional headers to include
 * @returns {Object} Complete headers object
 */
const buildHeaders = (customHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Fetch wrapper with automatic error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} On network error or HTTP error status
 */
const apiFetch = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = buildHeaders(options.headers);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/";
      throw new Error("Authentication failed. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
export const apiGet = (endpoint) => {
  return apiFetch(endpoint, { method: "GET" });
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Response data
 */
export const apiPost = (endpoint, data) => {
  return apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Response data
 */
export const apiPut = (endpoint, data) => {
  return apiFetch(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
export const apiDelete = (endpoint) => {
  return apiFetch(endpoint, { method: "DELETE" });
};

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  getAuthToken,
};
