// src/config/constants.js
/**
 * Application constants for routes, messages, and configuration
 */

/**
 * Route paths used throughout the application
 */
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SHOPIFY_CASES_RECEIVED: "/dashboard/shopify-cases-received",
  GENERIC_CASE_STATUS_UPDATE: "/dashboard/generic-case-status-update",
  CASES_SHIPPED_TO_CUSTOMER: "/dashboard/cases-shipped-to-customer",
};

/**
 * User-facing messages
 */
export const MESSAGES = {
  LOGIN_TITLE: "Admin Login",
  DASHBOARD_TITLE: "Admin Dashboard",
  WELCOME_MESSAGE: "Welcome to the admin panel.",
  LOADING: "Loading...",
  LOGOUT: "Logout",
  LOGIN_WITH_GOOGLE: "Login with Google",
  LOGIN_WITH_CREDENTIALS: "Login with Credentials",
  USERNAME_PLACEHOLDER: "Enter your username",
  PASSWORD_PLACEHOLDER: "Enter your password",
  SIGN_IN: "Sign In",
  FORGOT_PASSWORD: "Forgot password?",
  OR_DIVIDER: "or",
  LOGIN_ERROR_INVALID: "Invalid username or password",
  LOGIN_ERROR_REQUIRED: "Username and password are required",
  LOGIN_ERROR_NETWORK: "Network error. Please try again.",
  LOGIN_SUCCESS: "Login successful",
};

/**
 * Navigation menu items with nested structure
 */
export const NAV_ITEMS = [
  { label: "Home", key: "home", route: ROUTES.DASHBOARD },
  {
    label: "Transaction Manager (Tags)",
    key: "transaction-manager",
    children: [
      {
        label: "Shopify Cases Received",
        key: "shopify-cases-received",
        route: ROUTES.SHOPIFY_CASES_RECEIVED,
      },
      {
        label: "Generic Case Status Update",
        key: "generic-case-status-update",
        route: ROUTES.GENERIC_CASE_STATUS_UPDATE,
      },
      {
        label: "Cases Shipped to Customer",
        key: "cases-shipped-to-customer",
        route: ROUTES.CASES_SHIPPED_TO_CUSTOMER,
      },
    ],
  },
  { label: "Users", key: "users", route: null },
  { label: "Settings", key: "settings", route: null },
  { label: "Reports", key: "reports", route: null },
];
