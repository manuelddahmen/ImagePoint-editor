
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// ==============================================================================
// IMPORTANT: Firebase Configuration Setup
// ==============================================================================
// This application requires Firebase configuration values to be set in your
// environment variables. These variables allow the app to connect to your
// Firebase project for authentication and other services.
//
// Please ensure you have a `.env.local` file in the root of your project
// with the following variables defined, replacing the placeholder values
// with your actual Firebase project credentials:
//
// NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
// NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
//
// Optional but recommended:
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
// NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
//
// You can find these values in your Firebase project console:
// Project settings > General > Your apps > Web app > SDK setup and configuration > Config
//
// See the `.env.local.example` file for a template.
//
// If these variables are not set correctly, Firebase initialization will fail,
// and authentication features will be unavailable. The application will display
// an error message in this case.
//
// COMMON ERROR: FirebaseError: Error (auth/configuration-not-found)
// ===================================================================
// This specific error usually means one of the following:
// 1. Incorrect Configuration in `.env.local`: Double-check that the API Key,
//    Auth Domain, and Project ID in your `.env.local` file EXACTLY match the
//    values from your Firebase project console. Copy and paste carefully.
// 2. Authentication Providers Not Enabled: Ensure that the sign-in methods
//    you intend to use (Email/Password, Google, Microsoft, Twitter/X.com) are
//    ENABLED in your Firebase console:
//    Go to Authentication > Sign-in method. Enable each provider you need.
//    - For Google: Ensure you've configured the OAuth consent screen in Google Cloud Console
//      and added the Client ID and Secret in the Firebase Google provider settings.
//    - For Microsoft: You'll need to register an app in Azure AD, get the Client ID and Secret,
//      and add them to the Firebase Microsoft provider settings.
//    - For Twitter/X.com: You'll need to create an app on the Twitter Developer Portal,
//      get the API Key and Secret, enable OAuth 1.0a, add the callback URL provided by Firebase,
//      and configure these keys in the Firebase Twitter provider settings.
// 3. Unauthorized Domain: The domain your application is running on (e.g.,
//    `localhost`, your specific preview URL like `https://xxxx-studio...cloudworkstations.dev`,
//    or your production domain) MUST be added to the list of authorized domains.
//    Go to Authentication > Settings > Authorized domains. Add all necessary domains.
//    For local development, `localhost` is usually added by default, but verify it.
//    For cloud development environments (like IDX), you *must* add the preview URL.
//
// After making changes in the Firebase console or `.env.local`, you may need
// to restart the Next.js development server for the changes to take effect.
// ==============================================================================


// Get Firebase config variables from environment or use placeholders
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "MISSING_API_KEY";
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "MISSING_AUTH_DOMAIN";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "MISSING_PROJECT_ID";
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

// Check if essential config is *actually* present (placeholders don't count)
const isApiKeyMissing = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || apiKey === "MISSING_API_KEY";
const isAuthDomainMissing = !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || authDomain === "MISSING_AUTH_DOMAIN";
const isProjectIdMissing = !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || projectId === "MISSING_PROJECT_ID";

// Only set the error if it hasn't been set already (to avoid duplicate logs)
if ((isApiKeyMissing || isAuthDomainMissing || isProjectIdMissing) && !firebaseInitializationError) {
    let missingVars = [];
    if (isApiKeyMissing) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (isAuthDomainMissing) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (isProjectIdMissing) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    firebaseInitializationError = `Missing Firebase configuration. Please set the following environment variables: ${missingVars.join(', ')}`;
    // Log error during server/client initialization instead of throwing
    console.error(firebaseInitializationError); // Log configuration error immediately
} else {
    // Construct the config object ONLY if essential variables are present
    const firebaseConfig: FirebaseOptions = {
        apiKey: apiKey,
        authDomain: authDomain,
        projectId: projectId,
        storageBucket: storageBucket,
        messagingSenderId: messagingSenderId,
        appId: appId,
        measurementId: measurementId,
    };

    // Initialize Firebase only if config is valid and no app exists.
    if (!getApps().length) {
        try {
            app = initializeApp(firebaseConfig);
        } catch (error: any) {
            // Only set if not already set by missing env vars check
            if (!firebaseInitializationError) {
                firebaseInitializationError = `Firebase initialization error: ${error.message}`;
                console.error(firebaseInitializationError, error);
            }
            app = null; // Ensure app is null on error
        }
    } else {
        app = getApp(); // Get existing app
    }
} // End of conditional initialization based on env vars


// Initialize Auth only if app was successfully initialized/retrieved and no initialization error occurred
if (app && !firebaseInitializationError) {
    try {
        auth = getAuth(app);
    } catch (error: any) {
        // Only set if not already set
        if (!firebaseInitializationError) {
             firebaseInitializationError = `Firebase Auth initialization error: ${error.message}`;
             console.error(firebaseInitializationError, error);
        }
         auth = null; // Ensure auth is null on error
    }
} else if (!app && !firebaseInitializationError) {
     // If app is null and we didn't have a config or init error, something else went wrong.
     firebaseInitializationError = "Firebase app instance is not available, cannot initialize Auth.";
     console.error(firebaseInitializationError); // Log this specific case
}


// Export potentially null app and auth, and the error message
export { app, auth, firebaseInitializationError };
