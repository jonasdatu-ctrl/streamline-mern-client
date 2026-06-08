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
  CASES: "/dashboard/cases",
  SHOPIFY_CASES_RECEIVED: "/dashboard/shopify-cases-received",
  SPECIAL_SHOPIFY_CASES_RECEIVED: "/dashboard/special-shopify-cases-received",
  CASE_STATUS_UPDATE: "/dashboard/case-status-update",
  CASES_SHIPPED_TO_CUSTOMER: "/dashboard/cases-shipped-to-customer",
  CASES_SHIPPED_TO_CUSTOMER_CSV:
    "/dashboard/offline-processes/cases-shipped-to-customer-csv",
  RUSH_CASES_REPORT: "/dashboard/reports/rush-cases",
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
    label: "Cases",
    key: "cases",
    route: ROUTES.CASES,
    children: [
      {
        label: "Search Case ID",
        key: "search-case-id",
        route: null,
        disabled: true,
      },
    ],
  },
  {
    label: "Transaction Manager (Tags)",
    key: "transaction-manager",
    children: [
      {
        label: "Shopify Cases Received - 8+ Digits",
        key: "shopify-cases-received",
        route: ROUTES.SHOPIFY_CASES_RECEIVED,
      },
      {
        label: "Special Shopify Cases Received - Less than 8 Digits",
        key: "special-shopify-cases-received",
        route: ROUTES.SPECIAL_SHOPIFY_CASES_RECEIVED,
      },
      {
        label: "Case Status Update",
        key: "case-status-update",
        route: ROUTES.CASE_STATUS_UPDATE,
      },
      {
        label: "Cases Shipped to Customer",
        key: "cases-shipped-to-customer",
        route: ROUTES.CASES_SHIPPED_TO_CUSTOMER,
      },
    ],
  },
  {
    label: "Offline Processes",
    key: "offline-processes",
    children: [
      {
        label: "Cases Shipped to Customer (CSV)",
        key: "cases-shipped-to-customer-csv",
        route: ROUTES.CASES_SHIPPED_TO_CUSTOMER_CSV,
      },
    ],
  },
  // { label: "Users", key: "users", route: null },
  // { label: "Settings", key: "settings", route: null },
  {
    label: "Reports and Analytics",
    key: "reports-and-analytics",
    children: [
      {
        label: "Rush Cases",
        key: "rush-cases-report",
        route: ROUTES.RUSH_CASES_REPORT,
      },
    ],
  },
];
