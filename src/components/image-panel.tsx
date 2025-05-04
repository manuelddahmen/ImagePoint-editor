
"use client";

import type { ChangeEvent, MouseEvent } from "react";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import type { Point } from "@/types";
import { cn } from "@/lib/utils";

interface ImagePanelProps {
  uniqueId: string; // Added uniqueId prop
  imageSrc: string | null;
  points: Point[];
  selectedPointId: string | null;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAddPoint: (e: MouseEvent<HTMLDivElement>) => void;
  onSelectPoint: (id: string | null) => void;
  imageRef: React.RefObject<HTMLImageElement>;
  matchedPoints: string[];
  otherMatchedPoints: string[];
  ['data-ai-hint']?: string; // Add data-ai-hint prop
}

export function ImagePanel({
  uniqueId, // Destructure uniqueId
  imageSrc,
  points,
  selectedPointId,
  onImageUpload,
  onAddPoint,
  onSelectPoint,
  imageRef,
  matchedPoints,
  otherMatchedPoints,
  ['data-ai-hint']: dataAiHint
}: ImagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const uploadInputId = `upload-${uniqueId}`; // Use uniqueId for stable ID

  // Update container size for responsive point rendering
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handlePointClick = (e: MouseEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation(); // Prevent triggering onAddPoint
    onSelectPoint(id === selectedPointId ? null : id);
  };

  const getPointDisplayPosition = (point: Point) => {
     // Calculate display position based on container size
     return {
       left: `${point.x * 100}%`,
       top: `${point.y * 100}%`,
     };
   };


  return (
    <div className="flex flex-col items-center space-y-4 flex-grow relative mb-4">
       <div ref={containerRef} className="relative w-full h-64 bg-muted rounded-md overflow-hidden border border-border cursor-crosshair" onClick={onAddPoint}>
         {imageSrc ? (
          <>
            <Image
              ref={imageRef}
              src={imageSrc}
              alt="Editable image"
              layout="fill"
              objectFit="contain"
              priority // Prioritize loading visible images
              data-ai-hint={dataAiHint} // Pass the hint to the Image component
            />
            {points.map((point) => {
               const isMatched = matchedPoints.includes(point.id);
               const isOtherMatched = otherMatchedPoints.includes(point.id); // Check if it's matched in the other list

               return (
                  <div
                    key={point.id}
                    className={cn(
                      "absolute w-3 h-3 rounded-full border-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 shadow-md",
                      selectedPointId === point.id ? "border-destructive bg-red-400 scale-125" : "border-primary bg-accent/80",
                       isMatched ? "ring-2 ring-offset-1 ring-green-500" : "", // Highlight matched points
                      // Do not apply special styling if it's matched in the *other* list directly on the point marker
                    )}
                    style={getPointDisplayPosition(point)}
                    onClick={(e) => handlePointClick(e, point.id)}
                    title={`Point ID: ${point.id.substring(6,11)} (${point.x.toFixed(3)}, ${point.y.toFixed(3)})`}
                 />
               );
             })}
           </>
         ) : (
           <div className="flex items-center justify-center h-full text-muted-foreground">
             Upload an image to start
           </div>
         )}
       </div>
      <Button variant="outline" size="sm" asChild>
        <label htmlFor={uploadInputId} className="cursor-pointer"> {/* Use stable ID */}
          <Upload className="mr-2 h-4 w-4" /> Upload Image
          <Input
            id={uploadInputId} // Use stable ID
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
      </Button>
    </div>
  );
}
