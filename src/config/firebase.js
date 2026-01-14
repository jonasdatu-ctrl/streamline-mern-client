// src/config/firebase.js
/**
 * Firebase configuration and initialization
 * This file sets up Firebase services for the application
 *
 * IMPORTANT: For security, Firebase config should use environment variables.
 * Create a .env file in the root directory with your Firebase config values.
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Firebase configuration object
 * Values are loaded from environment variables for security
 * If env vars are not set, falls back to hardcoded values (not recommended for production)
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase app
 * This creates the Firebase app instance used throughout the application
 */
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase app:", error);
  throw error; // Re-throw to prevent app from running with broken Firebase
}

/**
 * Firebase Authentication instance
 * Used for user authentication operations
 */
export const auth = getAuth(app);

/**
 * Google Authentication Provider
 * Configured for Google sign-in functionality
 */
export const googleProvider = new GoogleAuthProvider();

// Optional: Configure additional provider settings
googleProvider.setCustomParameters({
  prompt: "select_account", // Always show account picker
});
