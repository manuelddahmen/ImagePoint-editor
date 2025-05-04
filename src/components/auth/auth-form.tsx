
"use client";

import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  type AuthError
} from 'firebase/auth';
// Import potentially null auth and error message
import { auth, firebaseInitializationError } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Mail, Lock, LogIn, UserPlus, Twitter, Github, AlertTriangle } from 'lucide-react'; // Using Github as placeholder for MS
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom Microsoft Icon (simple SVG placeholder)
const MicrosoftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M1 1H7V7H1V1ZM9 1H15V7H9V1ZM1 9H7V15H1V9ZM9 9H15V15H9V9Z" fill="#7FBA00"/>
    </svg>
);


export function AuthForm() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // If Firebase failed to initialize, show an error message instead of the form
  if (!auth || firebaseInitializationError) {
      return (
           <Alert variant="destructive" className="w-[400px] mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Unavailable</AlertTitle>
              <AlertDescription>
                 Firebase authentication could not be initialized. Please check the console for errors or contact support.
                 {firebaseInitializationError && <p className="mt-2 text-xs">{firebaseInitializationError}</p>}
              </AlertDescription>
           </Alert>
      );
  }

  const handleAuthError = (error: AuthError) => {
    console.error("Authentication error:", error);
    let description = 'An unknown error occurred.';
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            description = 'Invalid email or password.';
            break;
        case 'auth/email-already-in-use':
            description = 'This email is already registered.';
            break;
        case 'auth/weak-password':
            description = 'Password should be at least 6 characters.';
            break;
        case 'auth/invalid-email':
            description = 'Please enter a valid email address.';
            break;
        case 'auth/popup-closed-by-user':
             description = 'Sign-in process cancelled.';
             break;
        case 'auth/account-exists-with-different-credential':
             description = 'An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.';
             break;
        case 'auth/auth-domain-config-required':
             description = 'Authentication domain configuration is required.';
             break;
        case 'auth/cancelled-popup-request':
             description = 'Only one popup request is allowed at a time.';
             break;
        case 'auth/operation-not-allowed':
             description = 'The sign-in method is not enabled in Firebase console.';
             break;
        case 'auth/unauthorized-domain':
             description = 'This domain is not authorized for OAuth operations for your Firebase project.';
             break;
        // Add more specific cases as needed
        default:
            description = error.message; // Use Firebase's message as fallback
            break;
    }
    toast({
      title: 'Authentication Failed',
      description: description,
      variant: 'destructive',
    });
  }

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return; // Should not happen if initial check passed, but safety first
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      // Redirect or state update handled by AuthProvider
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      // Redirect or state update handled by AuthProvider
    } catch (error) {
        handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (providerInstance: GoogleAuthProvider | OAuthProvider | TwitterAuthProvider) => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithPopup(auth, providerInstance);
      toast({ title: 'Sign In Successful', description: 'Welcome!' });
      // Redirect or state update handled by AuthProvider
    } catch (error) {
        handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      {/* Login Tab */}
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Access your account using your credentials or a provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="m@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="pl-8" // Add padding for the icon
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="pl-8" // Add padding for the icon
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2" /> {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => handleOAuthSignIn(new GoogleAuthProvider())} disabled={loading}>
                <Chrome className="mr-2" /> Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuthSignIn(new OAuthProvider('microsoft.com'))} disabled={loading}>
                 <MicrosoftIcon /> <span className="ml-2">Microsoft</span>
              </Button>
              <Button variant="outline" onClick={() => handleOAuthSignIn(new TwitterAuthProvider())} disabled={loading}>
                <Twitter className="mr-2" /> X.com
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sign Up Tab */}
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new account or sign up using a provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <form onSubmit={handleEmailPasswordSignup} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="signup-email">Email</Label>
                 <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="signup-email"
                        type="email"
                        placeholder="m@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="pl-8"
                    />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="pl-8"
                    />
                  </div>
               </div>
               <Button type="submit" className="w-full" disabled={loading}>
                 <UserPlus className="mr-2" /> {loading ? 'Signing up...' : 'Sign Up'}
               </Button>
             </form>
             <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>
             <div className="grid grid-cols-3 gap-2">
               <Button variant="outline" onClick={() => handleOAuthSignIn(new GoogleAuthProvider())} disabled={loading}>
                 <Chrome className="mr-2" /> Google
               </Button>
               <Button variant="outline" onClick={() => handleOAuthSignIn(new OAuthProvider('microsoft.com'))} disabled={loading}>
                 <MicrosoftIcon /> <span className="ml-2">Microsoft</span>
               </Button>
               <Button variant="outline" onClick={() => handleOAuthSignIn(new TwitterAuthProvider())} disabled={loading}>
                 <Twitter className="mr-2" /> X.com
               </Button>
             </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
