
"use client";

import type { ChangeEvent, MouseEvent } from "react";
import React, { useState, useRef, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ImagePanel } from "@/components/image-panel";
import { PointList } from "@/components/point-list";
import type { Point } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, Upload, LinkIcon as Link } from "lucide-react"; // Updated Link import
import { useToast } from "@/hooks/use-toast";

// Generate a simple unique ID
const generateId = (): string => `point_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export function ImagePointEditor() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [points1, setPoints1] = useState<Point[]>([]);
  const [points2, setPoints2] = useState<Point[]>([]);
  const [selectedPointId1, setSelectedPointId1] = useState<string | null>(null);
  const [selectedPointId2, setSelectedPointId2] = useState<string | null>(null);
  const [matchedPoints, setMatchedPoints] = useState<[string, string][]>([]);

  const imageRef1 = useRef<HTMLImageElement>(null);
  const imageRef2 = useRef<HTMLImageElement>(null);
  const { toast } = useToast(); // Initialize toast

  // Load initial placeholder images
  useEffect(() => {
    // Using placeholder images for initial load
    setImage1("https://picsum.photos/800/600?random=1");
    setImage2("https://picsum.photos/800/600?random=2");
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>, setImage: (url: string | null) => void, setPoints: React.Dispatch<React.SetStateAction<Point[]>>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
         // Reset points and matches when a new image is loaded
         setPoints([]);
         setMatchedPoints([]);
         setSelectedPointId1(null); // Also reset selection
         setSelectedPointId2(null);
         toast({ title: "Image Loaded", description: "Points and matches have been reset." });
      };
      reader.readAsDataURL(file);
    }
     // Reset input value to allow loading the same file again
     event.target.value = '';
  };


  const handleAddPoint = (
    e: MouseEvent<HTMLDivElement>,
    imageRef: React.RefObject<HTMLImageElement>,
    setPoints: React.Dispatch<React.SetStateAction<Point[]>>
  ) => {
    if (!imageRef.current) {
        toast({ title: "Error", description: "Image not loaded correctly.", variant: "destructive" });
        return;
    };

    // Use the container div for coordinate calculation
    const container = e.currentTarget as HTMLDivElement; // The div with the onClick handler
    const rect = container.getBoundingClientRect();

    // Calculate click position relative to the container element
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale the click position relative to the container's dimensions.
    const scaledX = clickX / container.offsetWidth;
    const scaledY = clickY / container.offsetHeight;

    // Ensure coordinates are within [0, 1] bounds
    const finalX = Math.max(0, Math.min(1, scaledX));
    const finalY = Math.max(0, Math.min(1, scaledY));

    const newPoint: Point = {
      id: generateId(),
      x: finalX,
      y: finalY,
    };
    setPoints((prevPoints) => [...prevPoints, newPoint]);
    toast({ title: "Point Added", description: `New point added at (${finalX.toFixed(3)}, ${finalY.toFixed(3)})` });
  };


  const handleEditPoint = (
    id: string,
    newX: number,
    newY: number,
    setPoints: React.Dispatch<React.SetStateAction<Point[]>>
  ) => {
     // Ensure coordinates are within [0, 1]
    const finalX = Math.max(0, Math.min(1, newX));
    const finalY = Math.max(0, Math.min(1, newY));

    setPoints((prevPoints) =>
      prevPoints.map((p) => (p.id === id ? { ...p, x: finalX, y: finalY } : p))
    );
    toast({ title: "Point Updated", description: `Point ${id.substring(6,11)} updated to (${finalX.toFixed(3)}, ${finalY.toFixed(3)})` });
  };

  const handleDeletePoint = (id: string, setPoints: React.Dispatch<React.SetStateAction<Point[]>>) => {
    setPoints((prevPoints) => prevPoints.filter((p) => p.id !== id));
    // Also remove from matched points if it exists there
    setMatchedPoints(prevMatched => prevMatched.filter(match => match[0] !== id && match[1] !== id));
    toast({ title: "Point Deleted", description: `Point ${id.substring(6,11)} removed.`, variant: "destructive" });
  };

  // Simple reciprocal matching: pairs points based on order
  const handleMatchPoints = () => {
      const matches: [string, string][] = [];
      const len = Math.min(points1.length, points2.length);
      if (len === 0) {
           toast({ title: "Matching Failed", description: "Need points in both images to match.", variant: "destructive"});
           return;
      }
      for (let i = 0; i < len; i++) {
          matches.push([points1[i].id, points2[i].id]);
      }
      setMatchedPoints(matches);
      toast({ title: "Points Matched", description: `${len} pair(s) matched based on order.` });
  };

  const formatPointsForSave = (points: Point[]): string => {
    // Header line for potential future use or clarity
    let data = "# Point data format: ID, X, Y (one per line), separated by an empty line\n";
    data += points.map(p => `${p.id}\n${p.x}\n${p.y}`).join('\n\n');
     data += '\n'; // Ensure trailing newline for the last point block
    return data;
  };


  const handleSavePoints = (points: Point[], filename: string) => {
     if (points.length === 0) {
        toast({ title: "Save Failed", description: "No points to save.", variant: "destructive" });
        return;
     }
    const data = formatPointsForSave(points);
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Points Saved", description: `${points.length} points saved to ${filename}` });
  };

 const parsePointsFromString = (data: string): Point[] => {
     const points: Point[] = [];
     // Split by double newline to separate point blocks, filter empty strings
     const pointBlocks = data.split('\n\n').filter(block => block.trim() !== '' && !block.startsWith('#'));

     pointBlocks.forEach((block, index) => {
         const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '');
         if (lines.length === 3) {
             const id = lines[0];
             const xStr = lines[1];
             const yStr = lines[2];

             const x = parseFloat(xStr);
             const y = parseFloat(yStr);

             if (!isNaN(x) && !isNaN(y) && id) {
                 points.push({ id, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
             } else {
                  console.warn(`Skipping invalid point data block ${index + 1}: id=${id}, x=${xStr}, y=${yStr}`);
                  toast({
                     title: "Parsing Warning",
                     description: `Skipped invalid point data in block ${index + 1}. Check console for details.`,
                     variant: "destructive"
                   });
             }
         } else {
              console.warn(`Skipping invalid block ${index + 1}: Expected 3 lines, found ${lines.length}. Content: ${block}`);
              toast({
                 title: "Parsing Warning",
                 description: `Skipped invalid block ${index + 1} (incorrect line count). Check console for details.`,
                 variant: "destructive"
               });
         }
     });
     return points;
 };


 const handleLoadPoints = (event: ChangeEvent<HTMLInputElement>, setPoints: React.Dispatch<React.SetStateAction<Point[]>>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                try {
                    const loadedPoints = parsePointsFromString(content);
                    setPoints(loadedPoints);
                    // Reset matching if points are loaded
                    setMatchedPoints([]);
                     setSelectedPointId1(null); // Also reset selection
                     setSelectedPointId2(null);
                     toast({ title: "Points Loaded", description: `${loadedPoints.length} points loaded successfully. Matches reset.` });
                } catch (error) {
                     console.error("Error parsing points file:", error);
                     toast({ title: "Load Failed", description: "Could not parse the points file. Check format.", variant: "destructive" });
                }
            } else {
                 console.error("Failed to read file content.");
                 toast({ title: "Load Failed", description: "Could not read the file content.", variant: "destructive" });
            }
        };
         reader.onerror = (e) => {
            console.error("Error reading file:", e);
             toast({ title: "Load Failed", description: "Error reading the file.", variant: "destructive" });
        };
        reader.readAsText(file);
    }
     // Reset input value to allow loading the same file again
     event.target.value = '';
 };


  return (
    <ResizablePanelGroup direction="horizontal" className="w-full max-w-7xl h-[80vh] rounded-lg border shadow-lg bg-card">
      <ResizablePanel defaultSize={35} minSize={20}>
        <div className="flex flex-col h-full p-4">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Image 1</h2>
          <ImagePanel
            uniqueId="image1" // Pass unique ID
            imageSrc={image1}
            points={points1}
            selectedPointId={selectedPointId1}
            onImageUpload={(e) => handleImageUpload(e, setImage1, setPoints1)}
            onAddPoint={(e) => handleAddPoint(e, imageRef1, setPoints1)}
            onSelectPoint={setSelectedPointId1}
            imageRef={imageRef1}
            matchedPoints={matchedPoints.map(m => m[0])}
            otherMatchedPoints={matchedPoints.map(m => m[1])}
            data-ai-hint="abstract texture"
          />
           <div className="flex-grow overflow-hidden py-4"> {/* Added padding */}
              <PointList
                points={points1}
                selectedPointId={selectedPointId1}
                onSelectPoint={setSelectedPointId1}
                onEditPoint={(id, x, y) => handleEditPoint(id, x, y, setPoints1)}
                onDeletePoint={(id) => handleDeletePoint(id, setPoints1)}
                matchedPoints={matchedPoints}
                isSourceList={true}
              />
            </div>
           <div className="mt-auto flex gap-2 pt-4 border-t border-border"> {/* Added border */}
                <Button onClick={() => handleSavePoints(points1, 'points1.txt')} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Save Points
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="load-points1" className="cursor-pointer flex items-center"> {/* Added flex and items-center */}
                    <Upload className="mr-2 h-4 w-4" /> Load Points
                    <input
                      id="load-points1"
                      type="file"
                      accept=".txt,text/plain" // Accept .txt and plain text
                      onChange={(e) => handleLoadPoints(e, setPoints1)}
                      className="hidden"
                    />
                  </label>
                </Button>
            </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={35} minSize={20}>
        <div className="flex flex-col h-full p-4">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Image 2</h2>
          <ImagePanel
            uniqueId="image2" // Pass unique ID
            imageSrc={image2}
            points={points2}
            selectedPointId={selectedPointId2}
            onImageUpload={(e) => handleImageUpload(e, setImage2, setPoints2)}
            onAddPoint={(e) => handleAddPoint(e, imageRef2, setPoints2)}
            onSelectPoint={setSelectedPointId2}
            imageRef={imageRef2}
            matchedPoints={matchedPoints.map(m => m[1])}
            otherMatchedPoints={matchedPoints.map(m => m[0])}
             data-ai-hint="geometric pattern"
          />
          <div className="flex-grow overflow-hidden py-4"> {/* Added padding */}
              <PointList
                points={points2}
                selectedPointId={selectedPointId2}
                onSelectPoint={setSelectedPointId2}
                onEditPoint={(id, x, y) => handleEditPoint(id, x, y, setPoints2)}
                onDeletePoint={(id) => handleDeletePoint(id, setPoints2)}
                matchedPoints={matchedPoints}
                isSourceList={false}
              />
           </div>
           <div className="mt-auto flex gap-2 pt-4 border-t border-border"> {/* Added border */}
               <Button onClick={() => handleSavePoints(points2, 'points2.txt')} variant="outline" size="sm">
                   <Download className="mr-2 h-4 w-4" /> Save Points
               </Button>
               <Button variant="outline" size="sm" asChild>
                  <label htmlFor="load-points2" className="cursor-pointer flex items-center"> {/* Added flex and items-center */}
                    <Upload className="mr-2 h-4 w-4" /> Load Points
                    <input
                      id="load-points2"
                      type="file"
                      accept=".txt,text/plain" // Accept .txt and plain text
                      onChange={(e) => handleLoadPoints(e, setPoints2)}
                      className="hidden"
                    />
                  </label>
                </Button>
            </div>
        </div>
      </ResizablePanel>
       <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={15}>
            <div className="flex flex-col h-full p-4"> {/* Removed items-center for left align */}
                <h2 className="text-xl font-semibold mb-4 text-foreground text-center">Point Matching</h2> {/* Centered title */}
                 <div className="flex justify-center mb-4"> {/* Center button */}
                    <Button onClick={handleMatchPoints} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link className="mr-2 h-4 w-4" /> Match Points by Order
                     </Button>
                 </div>
                 <div className="w-full overflow-auto flex-grow"> {/* Added flex-grow */}
                    <h3 className="text-lg font-medium mb-2 text-foreground">Matched Pairs</h3>
                    {matchedPoints.length > 0 ? (
                        <ul className="space-y-1">
                            {matchedPoints.map(([id1, id2], index) => {
                                const point1 = points1.find(p => p.id === id1);
                                const point2 = points2.find(p => p.id === id2);
                                const p1Display = point1 ? `(${point1.x.toFixed(3)}, ${point1.y.toFixed(3)})` : 'N/A';
                                const p2Display = point2 ? `(${point2.x.toFixed(3)}, ${point2.y.toFixed(3)})` : 'N/A';
                                return (
                                    <li key={index} className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">
                                       <span className="font-semibold text-foreground">Pair {index + 1}:</span>
                                       <div className="flex justify-between items-center mt-1">
                                            <span className="font-mono text-xs" title={`Image 1 Point ID: ${id1}`}>
                                                Img1: <code className="bg-background/50 px-1 rounded">{id1.substring(6,11)}</code> {p1Display}
                                            </span>
                                            <Link className="h-3 w-3 text-primary mx-2 shrink-0" />
                                            <span className="font-mono text-xs text-right" title={`Image 2 Point ID: ${id2}`}>
                                                Img2: <code className="bg-background/50 px-1 rounded">{id2.substring(6,11)}</code> {p2Display}
                                            </span>
                                       </div>
                                    </li>
                                );
                             })}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {points1.length > 0 || points2.length > 0
                              ? 'Add points to both images and click "Match Points by Order".'
                              : 'Upload images and add points to begin.'}

                        </p>
                    )}
                </div>
            </div>
        </ResizablePanel>
    </ResizablePanelGroup>
  );
}
