
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

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
    console.error(firebaseInitializationError);
    // Note: We proceed with placeholder values so the app doesn't crash immediately,
    // but Firebase will not be functional. The error will be shown by AuthProvider.
}

// Construct the config object using potentially placeholder values
const firebaseConfig: FirebaseOptions = {
    apiKey: apiKey,
    authDomain: authDomain,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appId,
    measurementId: measurementId,
};

// Initialize Firebase only if config seems minimally valid (even with placeholders)
// and no app exists. We defer the *real* failure check to AuthProvider.
if (!getApps().length) {
    try {
        // Initialize with potentially placeholder values. `initializeApp` might
        // not throw immediately for just invalid keys, but subsequent operations will fail.
        app = initializeApp(firebaseConfig);
    } catch (error: any) {
        // Catch potential immediate initialization errors (less likely for just bad keys)
        firebaseInitializationError = firebaseInitializationError || `Firebase initialization error: ${error.message}`;
        console.error(firebaseInitializationError, error);
        app = null; // Ensure app is null on error
    }
} else {
    app = getApp(); // Get existing app
}

// Initialize Auth only if app was successfully initialized/retrieved
if (app && !firebaseInitializationError) { // Also check if we already detected missing config
    try {
        auth = getAuth(app);
    } catch (error: any) {
         firebaseInitializationError = `Firebase Auth initialization error: ${error.message}`;
         console.error(firebaseInitializationError, error);
         auth = null; // Ensure auth is null on error
    }
} else if (!firebaseInitializationError) {
     // This case should ideally not happen if config was valid, but safety first
     firebaseInitializationError = "Firebase app instance is not available, cannot initialize Auth.";
     console.error(firebaseInitializationError);
}


// Export potentially null app and auth, and the error message
export { app, auth, firebaseInitializationError };

