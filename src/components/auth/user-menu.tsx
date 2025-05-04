
"use client";

import React from 'react';
import { signOut } from 'firebase/auth';
// Import potentially null auth
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function UserMenu() {
  // Use error state from useAuth
  const { user, loading, error } = useAuth();

  const handleLogout = async () => {
     // Ensure auth object is available before attempting logout
     if (!auth) {
         console.error("Logout failed: Firebase Auth not initialized.");
         // Optionally show a toast notification
         return;
     }
    try {
      await signOut(auth);
      // Auth state change is handled by AuthProvider
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show a toast notification for logout failure
    }
  };

  // Show skeleton while loading
  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  // If there was an initialization error, don't show the menu
  // The AuthProvider might already show a full-page error,
  // but this prevents rendering the menu in case it doesn't.
  if (error) {
     return (
          <TooltipProvider>
              <Tooltip>
                 <TooltipTrigger asChild>
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                 </TooltipTrigger>
                 <TooltipContent>
                      <p>Auth unavailable: {error}</p>
                 </TooltipContent>
              </Tooltip>
          </TooltipProvider>
     );
  }


  // If not loading and no error, but user is null, don't show anything
  // (or optionally show a login button)
  if (!user) {
    return null;
  }

  // --- Render user menu if user exists and no errors ---

  const getInitials = (name?: string | null) => {
    if (!name) return <User className="h-4 w-4" />;
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    } else if (names[0]) {
         return names[0][0].toUpperCase();
    }
    return <User className="h-4 w-4" />; // Fallback if name is empty or unusual format
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
            ) : null}
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || 'No email provided'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Add other menu items like Profile, Settings etc. if needed */}
        {/* <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem> */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Need Tooltip components for the error state icon hint
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
