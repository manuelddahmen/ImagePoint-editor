import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

export const metadata: Metadata = {
  title: 'ImagePoint Editor', // Updated title
  description: 'Edit scaled coordinate points on images',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Removed Geist font classes to rely on globals.css font-family */}
      <body className="antialiased">
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
