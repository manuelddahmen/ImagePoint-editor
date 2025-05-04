
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
  uniqueId: string;
  imageSrc: string | null;
  points: Point[];
  selectedPointId: string | null;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAddPoint: (e: MouseEvent<HTMLDivElement>) => void; // Changed to DivElement
  onSelectPoint: (id: string | null) => void;
  imageRef: React.RefObject<HTMLImageElement>;
  matchedPoints: string[];
  otherMatchedPoints: string[];
  ['data-ai-hint']?: string;
}

export function ImagePanel({
  uniqueId,
  imageSrc,
  points,
  selectedPointId,
  onImageUpload,
  onAddPoint,
  onSelectPoint,
  imageRef, // Keep imageRef for potential future use or direct image access if needed
  matchedPoints,
  otherMatchedPoints,
  ['data-ai-hint']: dataAiHint
}: ImagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // No need for containerSize state if we calculate point position dynamically

  const uploadInputId = `upload-${uniqueId}`;

  const handlePointClick = (e: MouseEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation(); // Prevent triggering onAddPoint on the container
    onSelectPoint(id === selectedPointId ? null : id);
  };

  const getPointDisplayPosition = (point: Point): React.CSSProperties => {
    // Points are stored with coordinates relative to the original image dimensions (0-1 scale).
    // These need to be mapped to the *displayed* image size within the container,
    // respecting the object-fit: contain behavior.

    if (!containerRef.current || !imageRef.current?.naturalWidth || !imageRef.current?.naturalHeight) {
        // Default or fallback position if refs or image dimensions aren't available yet
        return { left: '50%', top: '50%', position: 'absolute', transform: 'translate(-50%, -50%)' };
    }

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    // Calculate the scaling factor of the displayed image
    const widthScale = containerWidth / naturalWidth;
    const heightScale = containerHeight / naturalHeight;
    const scale = Math.min(widthScale, heightScale); // 'contain' uses the smaller scale

    // Calculate the displayed dimensions of the image
    const displayWidth = naturalWidth * scale;
    const displayHeight = naturalHeight * scale;

    // Calculate the offset (padding) around the displayed image within the container
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    // Calculate the absolute pixel coordinates of the point on the *displayed* image
    const pointXAbsolute = point.x * displayWidth;
    const pointYAbsolute = point.y * displayHeight;

    // Calculate the final position relative to the container, including the offset
    const finalLeft = offsetX + pointXAbsolute;
    const finalTop = offsetY + pointYAbsolute;


    return {
      left: `${finalLeft}px`,
      top: `${finalTop}px`,
      position: 'absolute', // Ensure position is absolute
      transform: 'translate(-50%, -50%)', // Center the dot on the coordinate
    };
  };


  return (
    <div className="flex flex-col items-center space-y-4 flex-grow relative mb-4">
       {/* Container div handles clicks for adding points */}
       <div
          ref={containerRef}
          className="relative w-full h-64 bg-muted rounded-md overflow-hidden border border-border cursor-crosshair"
          onClick={onAddPoint} // Add point handler on the container
        >
         {imageSrc ? (
          <>
            <Image
              ref={imageRef} // Attach ref to the Next.js Image component
              src={imageSrc}
              alt="Editable image"
              fill // Use fill prop for modern Next.js
              style={{ objectFit: 'contain' }} // Explicitly set objectFit style
              priority // Prioritize loading visible images
              data-ai-hint={dataAiHint} // Pass the hint to the Image component
              // Add onLoad to potentially trigger recalculations if needed, though getPointDisplayPosition handles dynamic sizing
              onLoad={() => {
                // Force re-render of points if necessary after image loads,
                // though dynamic calculation in getPointDisplayPosition should handle this.
                // Consider adding a state update trigger here if points don't appear correctly initially.
                 if (containerRef.current) {
                      // Force a dummy state update to re-render if needed
                      // setForceUpdate(c => c + 1); // Example: if using a dummy state
                 }
              }}
            />
            {points.map((point) => {
               const isMatched = matchedPoints.includes(point.id);
               const isOtherMatched = otherMatchedPoints.includes(point.id);

               return (
                  <div
                    key={point.id}
                    className={cn(
                      "absolute w-3 h-3 rounded-full border-2 cursor-pointer shadow-md", // Removed transform from base class
                      selectedPointId === point.id ? "border-destructive bg-red-400 scale-125 z-10" : "border-primary bg-accent/80 z-0", // Add z-index
                       isMatched ? "ring-2 ring-offset-1 ring-green-500" : "",
                    )}
                    style={getPointDisplayPosition(point)} // Style includes position and transform
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
        <label htmlFor={uploadInputId} className="cursor-pointer">
          <Upload className="mr-2 h-4 w-4" /> Upload Image
          <Input
            id={uploadInputId}
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
