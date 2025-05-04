
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
// Import the potentially null auth and the error message
import { auth, firebaseInitializationError } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null; // Add error state
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null, // Initialize error state
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Use the initialization error captured in firebase.ts as the initial state
  const [error, setError] = useState<string | null>(firebaseInitializationError);

  useEffect(() => {
    // If there was an initialization error detected in firebase.ts, don't attempt to listen
    if (firebaseInitializationError) {
        setLoading(false);
        return;
    }

    // Only set up listener if auth was initialized successfully AND no config error detected
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        setError(null); // Clear error if auth state changes successfully
      }, (error) => {
        // Handle errors during auth state observation (e.g., network issues, token expiry)
        console.error("Auth state change error:", error);
        setError(`Auth state error: ${error.message}`);
        setUser(null); // Ensure user is null on auth error
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else {
      // If auth is unexpectedly null (and no init error was caught earlier), set loading false.
      // The firebaseInitializationError should have caught config issues.
      setLoading(false);
      if (!error) { // Avoid overwriting the specific config error
        setError("Firebase Auth instance is not available.");
        console.error("Firebase Auth instance is not available.");
      }
    }
  }, []); // Dependency array includes `error` to potentially react if error state changes, though primarily driven by init.

  // Show an error message if Firebase initialization failed
  // This now correctly catches the error set initially from firebase.ts
  if (error && !loading) { // Show error only after initial check or if an error occurs later
    return (
       <div className="flex items-center justify-center min-h-screen p-4 bg-background">
           <Alert variant="destructive" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Unavailable</AlertTitle>
              <AlertDescription>
                 {error} Please check your Firebase configuration in the environment variables and ensure the Firebase project is set up correctly. Authentication features will be disabled.
              </AlertDescription>
           </Alert>
       </div>
    );
  }

  // Show a loading state while Firebase initializes or auth state is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        {/* Simple loading text */}
        <p>Loading authentication...</p>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

