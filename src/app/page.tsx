import { ImagePointEditor } from "@/components/image-point-editor";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <h1 className="text-3xl font-bold mb-8 text-foreground">ImagePoint Editor</h1>
      <ImagePointEditor />
    </main>
  );
}
