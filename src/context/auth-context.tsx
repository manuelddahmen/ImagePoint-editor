
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
  const [error, setError] = useState<string | null>(firebaseInitializationError); // Use error from firebase.ts

  useEffect(() => {
    // Only set up listener if auth was initialized successfully
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        setError(null); // Clear error if auth state changes successfully
      }, (error) => {
        // Handle errors during auth state observation (less common)
        console.error("Auth state change error:", error);
        setError(`Auth state error: ${error.message}`);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else {
      // If auth is null (due to init error), stop loading and keep the error state
      setLoading(false);
    }
  }, []); // Dependency array is empty because `auth` and `firebaseInitializationError` are stable module exports

  // Show an error message if Firebase initialization failed
  if (error && !loading) { // Show error only after initial check
    return (
       <div className="flex items-center justify-center min-h-screen p-4">
           <Alert variant="destructive" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Firebase Initialization Failed</AlertTitle>
              <AlertDescription>
                 {error} Please check your Firebase configuration in the environment variables and ensure the Firebase project is set up correctly.
              </AlertDescription>
           </Alert>
       </div>
    );
  }

  // Show a loading state while Firebase initializes or auth state is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* You can keep or customize the loading skeleton */}
        {/* <Skeleton className="h-12 w-12 rounded-full" />
           <Skeleton className="h-4 w-[250px] ml-4" /> */}
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

