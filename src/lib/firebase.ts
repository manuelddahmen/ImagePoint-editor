
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
// We check the actual environment variables, not the potentially defaulted ones above.
const isApiKeyMissing = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const isAuthDomainMissing = !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const isProjectIdMissing = !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (isApiKeyMissing || isAuthDomainMissing || isProjectIdMissing) {
    let missingVars = [];
    if (isApiKeyMissing) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (isAuthDomainMissing) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (isProjectIdMissing) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    firebaseInitializationError = `Missing Firebase configuration. Please set the following environment variables: ${missingVars.join(', ')}`;
    // Log error during server/client initialization instead of throwing
    // Only log this error once during initialization phase
    if (typeof window !== 'undefined') { // Log only on client-side to avoid duplicate server logs
        console.error(firebaseInitializationError);
    }
} else {
    // Construct the config object ONLY if essential variables are present
    const firebaseConfig: FirebaseOptions = {
        apiKey: apiKey,
        authDomain: authDomain,
        projectId: projectId,
        // Use the potentially undefined optional values directly
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
            firebaseInitializationError = firebaseInitializationError || `Firebase initialization error: ${error.message}`;
            console.error(firebaseInitializationError, error);
            app = null; // Ensure app is null on error
        }
    } else {
        app = getApp(); // Get existing app
    }
} // End of conditional initialization based on env vars


// Initialize Auth only if app was successfully initialized/retrieved and no config error occurred
if (app && !firebaseInitializationError) {
    try {
        auth = getAuth(app);
    } catch (error: any) {
         firebaseInitializationError = `Firebase Auth initialization error: ${error.message}`;
         console.error(firebaseInitializationError, error);
         auth = null; // Ensure auth is null on error
    }
} else if (!app && !firebaseInitializationError) {
     // If app is null and we didn't have a config error, it means initialization failed for another reason
     // or the config error block wasn't entered (shouldn't happen with current logic, but safety first)
     firebaseInitializationError = "Firebase app instance is not available, cannot initialize Auth.";
     // console.error(firebaseInitializationError); // Avoid redundant logging if config error already logged
}


// Export potentially null app and auth, and the error message
export { app, auth, firebaseInitializationError };
