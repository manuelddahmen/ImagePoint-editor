
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Get Firebase config variables from environment
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

// Check if essential config is present
if (!apiKey || !authDomain || !projectId) {
    let missingVars = [];
    if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    firebaseInitializationError = `Missing Firebase configuration. Please set the following environment variables: ${missingVars.join(', ')}`;
    // Log error during server/client initialization instead of throwing
    console.error(firebaseInitializationError);
} else {
    const firebaseConfig: FirebaseOptions = {
        apiKey: apiKey,
        authDomain: authDomain,
        projectId: projectId,
        storageBucket: storageBucket,
        messagingSenderId: messagingSenderId,
        appId: appId,
        measurementId: measurementId,
    };

    // Initialize Firebase only if config is valid and no app exists
    if (!getApps().length) {
        try {
            app = initializeApp(firebaseConfig);
        } catch (error: any) {
            firebaseInitializationError = `Firebase initialization error: ${error.message}`;
            console.error(firebaseInitializationError, error);
            app = null; // Ensure app is null on error
        }
    } else {
        app = getApp(); // Get existing app
    }

    // Initialize Auth only if app was successfully initialized/retrieved
    if (app) {
        try {
            auth = getAuth(app);
        } catch (error: any) {
             // This specific error seems less likely if app init is fine, but good to catch.
             firebaseInitializationError = `Firebase Auth initialization error: ${error.message}`;
             console.error(firebaseInitializationError, error);
             auth = null; // Ensure auth is null on error
        }
    } else if (!firebaseInitializationError) {
        // This case should ideally not happen if config was valid, but safety first
         firebaseInitializationError = "Firebase app instance is not available, cannot initialize Auth.";
         console.error(firebaseInitializationError);
    }
}

// Export potentially null app and auth, and the error message
export { app, auth, firebaseInitializationError };

