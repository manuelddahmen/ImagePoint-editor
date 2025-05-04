
"use client"; // Required because we use hooks (useAuth)

import { ImagePointEditor } from "@/components/image-point-editor";
import { AuthForm } from "@/components/auth/auth-form";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  // While loading, you might want to show a spinner or skeleton screen
  if (loading) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          {/* Optional: Add a loading indicator */}
          <p>Loading...</p>
        </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-background relative">
       {/* User Menu in the top-right corner */}
       <div className="absolute top-4 right-4 z-10">
         <UserMenu />
       </div>

      <h1 className="text-3xl font-bold mt-12 mb-8 text-foreground">ImagePoint Editor</h1>

      {user ? (
        // Show the editor if the user is logged in
        <ImagePointEditor />
      ) : (
        // Show the login/signup form if the user is not logged in
         <div className="flex flex-col items-center justify-center flex-grow">
            <AuthForm />
         </div>
      )}
    </main>
  );
}
