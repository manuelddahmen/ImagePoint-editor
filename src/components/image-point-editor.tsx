
"use client";

import type { ChangeEvent, MouseEvent } from "react";
import React, { useState, useRef, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ImagePanel } from "@/components/image-panel";
import { PointList } from "@/components/point-list";
import type { Point } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

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

  // Load initial placeholder images
  useEffect(() => {
    // Using placeholder images for initial load
    setImage1("https://picsum.photos/800/600?random=1");
    setImage2("https://picsum.photos/800/600?random=2");
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>, setImage: (url: string | null) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPoint = (
    e: MouseEvent<HTMLDivElement>,
    imageRef: React.RefObject<HTMLImageElement>,
    setPoints: React.Dispatch<React.SetStateAction<Point[]>>
  ) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    // Use offsetWidth/Height of the *container* (the div with the background) for scaling calculation,
    // as the image itself might not fill the container due to objectFit="contain".
    // We rely on the container's dimensions as the reference for the 0-1 scale.
    const container = (e.target as HTMLElement).closest('div[class*="cursor-crosshair"]');
    if (!container) return; // Should not happen if click is on the correct element

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;


    // Calculate click position relative to the container element
    const clickX = e.clientX - container.getBoundingClientRect().left;
    const clickY = e.clientY - container.getBoundingClientRect().top;

    // Scale the click position relative to the container's dimensions.
    const scaledX = clickX / containerWidth;
    const scaledY = clickY / containerHeight;

    // Ensure coordinates are within [0, 1] bounds
    const finalX = Math.max(0, Math.min(1, scaledX));
    const finalY = Math.max(0, Math.min(1, scaledY));

    const newPoint: Point = {
      id: generateId(),
      x: finalX,
      y: finalY,
    };
    setPoints((prevPoints) => [...prevPoints, newPoint]);
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
  };

  const handleDeletePoint = (id: string, setPoints: React.Dispatch<React.SetStateAction<Point[]>>) => {
    setPoints((prevPoints) => prevPoints.filter((p) => p.id !== id));
    // Also remove from matched points if it exists there
    setMatchedPoints(prevMatched => prevMatched.filter(match => match[0] !== id && match[1] !== id));
  };

  // Simple reciprocal matching: pairs points based on order
  const handleMatchPoints = () => {
      const matches: [string, string][] = [];
      const len = Math.min(points1.length, points2.length);
      for (let i = 0; i < len; i++) {
          matches.push([points1[i].id, points2[i].id]);
      }
      setMatchedPoints(matches);
  };

  const formatPointsForSave = (points: Point[]): string => {
    return points.map(p => `${p.id}\n${p.x}\n${p.y}\n`).join('\n');
  };

  const handleSavePoints = (points: Point[], filename: string) => {
    const data = formatPointsForSave(points);
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parsePointsFromString = (data: string): Point[] => {
      const lines = data.split('\n');
      const points: Point[] = [];
      for (let i = 0; i < lines.length; i += 4) {
          if (lines[i] && lines[i+1] && lines[i+2]) {
              const id = lines[i].trim(); // Trim whitespace
              const xStr = lines[i+1].trim();
              const yStr = lines[i+2].trim();
              if (id && xStr && yStr) { // Ensure lines are not empty
                const x = parseFloat(xStr);
                const y = parseFloat(yStr);
                // Basic validation
                if (!isNaN(x) && !isNaN(y) && id) {
                    points.push({ id, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
                } else {
                    console.warn(`Skipping invalid point data: id=${id}, x=${xStr}, y=${yStr}`);
                }
              }
          }
      }
      return points;
  };

 const handleLoadPoints = (event: ChangeEvent<HTMLInputElement>, setPoints: React.Dispatch<React.SetStateAction<Point[]>>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                const loadedPoints = parsePointsFromString(content);
                setPoints(loadedPoints);
                // Reset matching if points are loaded
                setMatchedPoints([]);
            } else {
                 console.error("Failed to read file content.");
            }
        };
         reader.onerror = (e) => {
            console.error("Error reading file:", e);
        };
        reader.readAsText(file);
    }
     // Reset input value to allow loading the same file again
     event.target.value = '';
 };


  return (
    <ResizablePanelGroup direction="horizontal" className="w-full max-w-7xl h-[70vh] rounded-lg border shadow-lg bg-card">
      <ResizablePanel defaultSize={35} minSize={20}>
        <div className="flex flex-col h-full p-4">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Image 1</h2>
          <ImagePanel
            uniqueId="image1" // Pass unique ID
            imageSrc={image1}
            points={points1}
            selectedPointId={selectedPointId1}
            onImageUpload={(e) => handleImageUpload(e, setImage1)}
            onAddPoint={(e) => handleAddPoint(e, imageRef1, setPoints1)}
            onSelectPoint={setSelectedPointId1}
            imageRef={imageRef1}
            matchedPoints={matchedPoints.map(m => m[0])}
            otherMatchedPoints={matchedPoints.map(m => m[1])}
            data-ai-hint="abstract texture"
          />
          <PointList
            points={points1}
            selectedPointId={selectedPointId1}
            onSelectPoint={setSelectedPointId1}
            onEditPoint={(id, x, y) => handleEditPoint(id, x, y, setPoints1)}
            onDeletePoint={(id) => handleDeletePoint(id, setPoints1)}
            matchedPoints={matchedPoints}
            isSourceList={true}
          />
           <div className="mt-auto flex gap-2 pt-4">
                <Button onClick={() => handleSavePoints(points1, 'points1.txt')} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Save Points 1
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="load-points1" className="cursor-pointer flex items-center"> {/* Added flex and items-center */}
                    <Upload className="mr-2 h-4 w-4" /> Load Points 1
                    <input
                      id="load-points1"
                      type="file"
                      accept=".txt"
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
            onImageUpload={(e) => handleImageUpload(e, setImage2)}
            onAddPoint={(e) => handleAddPoint(e, imageRef2, setPoints2)}
            onSelectPoint={setSelectedPointId2}
            imageRef={imageRef2}
            matchedPoints={matchedPoints.map(m => m[1])}
            otherMatchedPoints={matchedPoints.map(m => m[0])}
             data-ai-hint="geometric pattern"
          />
          <PointList
            points={points2}
            selectedPointId={selectedPointId2}
            onSelectPoint={setSelectedPointId2}
            onEditPoint={(id, x, y) => handleEditPoint(id, x, y, setPoints2)}
            onDeletePoint={(id) => handleDeletePoint(id, setPoints2)}
            matchedPoints={matchedPoints}
            isSourceList={false}
          />
           <div className="mt-auto flex gap-2 pt-4">
               <Button onClick={() => handleSavePoints(points2, 'points2.txt')} variant="outline" size="sm">
                   <Download className="mr-2 h-4 w-4" /> Save Points 2
               </Button>
               <Button variant="outline" size="sm" asChild>
                  <label htmlFor="load-points2" className="cursor-pointer flex items-center"> {/* Added flex and items-center */}
                    <Upload className="mr-2 h-4 w-4" /> Load Points 2
                    <input
                      id="load-points2"
                      type="file"
                      accept=".txt"
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
            <div className="flex flex-col h-full p-4 items-center">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Point Matching</h2>
                <Button onClick={handleMatchPoints} className="mb-4 bg-accent text-accent-foreground hover:bg-accent/90">Match Points</Button>
                 <div className="w-full overflow-auto">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Matched Pairs</h3>
                    {matchedPoints.length > 0 ? (
                        <ul className="space-y-1">
                            {matchedPoints.map(([id1, id2], index) => {
                                const point1 = points1.find(p => p.id === id1);
                                const point2 = points2.find(p => p.id === id2);
                                return (
                                    <li key={index} className="text-sm text-muted-foreground p-1 border-b border-border">
                                       Pair {index + 1}: <span className="font-mono text-xs">({point1?.id.substring(6,11) ?? 'N/A'} ↔ {point2?.id.substring(6,11) ?? 'N/A'})</span>
                                    </li>
                                );
                             })}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No points matched yet. Add points to both images and click "Match Points".</p>
                    )}
                </div>
            </div>
        </ResizablePanel>
    </ResizablePanelGroup>
  );
}
