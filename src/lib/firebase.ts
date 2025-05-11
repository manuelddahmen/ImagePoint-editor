
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// ==============================================================================
// IMPORTANT: Firebase Configuration Troubleshooting (auth/configuration-not-found)
// ==============================================================================
//
// The error "FirebaseError: Firebase: Error (auth/configuration-not-found)"
// almost always means there's an issue with how your Firebase project is
// configured or how your application is connecting to it.
//
// PLEASE CHECK THE FOLLOWING CAREFULLY:
//
// 1. CORRECT `.env.local` VALUES:
//    - Ensure you have a `.env.local` file in the root of your project.
//    - Verify that the following variables are present and CORRECTLY copied
//      from your Firebase project settings (Project settings > General > Your apps > Web app):
//
//      NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_ACTUAL_API_KEY"
//      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_ACTUAL_AUTH_DOMAIN"
//      NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_ACTUAL_PROJECT_ID"
//      # Optional but recommended:
//      # NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
//      # NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
//      # NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
//      # NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
//
//    - TRIPLE-CHECK for typos or extra spaces.
//    - Make sure you are using the ACTUAL values, not placeholder text like "YOUR_API_KEY".
//    - Ensure the `.env.local` file is in the project's root directory.
//
// 2. ENABLE AUTHENTICATION PROVIDERS IN FIREBASE CONSOLE:
//    - Go to your Firebase project console -> Authentication -> Sign-in method.
//    - You MUST ENABLE every sign-in method you intend to use in your app.
//      This application attempts to use:
//        - Email/Password (Enable this)
//        - Google (Enable this and follow configuration steps if needed)
//        - Microsoft (Enable this and follow configuration steps)
//        - X (Twitter) (Enable this and follow configuration steps)
//    - If a provider is not enabled here, Firebase will reject attempts to use it,
//      sometimes resulting in a 'configuration-not-found' error.
//
// 3. AUTHORIZE DOMAINS IN FIREBASE CONSOLE:
//    - Go to your Firebase project console -> Authentication -> Settings -> Authorized domains.
//    - The domain your application is running on MUST be listed here.
//      - For local development: `localhost` should usually be present.
//      - For cloud development environments (like IDX, Gitpod, Codespaces): You MUST add the
//        specific preview URL (e.g., `https://*.cloudworkstations.dev`, `https://*.gitpod.io`).
//        Check your browser's address bar for the exact domain.
//      - For production: Add your final deployment domain(s).
//    - Failure to authorize the domain will prevent OAuth providers (Google, Microsoft, X)
//      from working correctly and can cause this error.
//
// 4. RESTART THE DEVELOPMENT SERVER:
//    - After creating or modifying `.env.local` or changing Firebase console settings,
//      STOP your Next.js development server (Ctrl+C in the terminal) and RESTART it (`npm run dev`).
//      Environment variables are loaded at build/start time.
//
// By systematically checking these four points, you should be able to resolve
// the `auth/configuration-not-found` error. The application code itself is
// designed to work once the Firebase configuration is correctly set up.
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
        // Add a check here to potentially catch config errors early on client-side
        // Note: This might not catch *all* config errors, but can help.
        // It might trigger a network request.
        // auth.operations.then(() => {}).catch(err => {
        //   if (!firebaseInitializationError) {
        //     firebaseInitializationError = `Firebase Auth runtime error (check config/providers/domains): ${err.message}`;
        //     console.error(firebaseInitializationError, err);
        //   }
        //   auth = null;
        // });
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
