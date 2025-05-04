"use client";

import React, { useState, useEffect } from 'react';
import type { Point } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit, Save, XCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointListProps {
  points: Point[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onEditPoint: (id: string, x: number, y: number) => void;
  onDeletePoint: (id: string) => void;
  matchedPoints: [string, string][];
  isSourceList: boolean; // True if this is the list for image 1, false for image 2
}

interface EditingState {
  [id: string]: { x: string; y: string };
}

export function PointList({
  points,
  selectedPointId,
  onSelectPoint,
  onEditPoint,
  onDeletePoint,
  matchedPoints,
  isSourceList,
}: PointListProps) {
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ x: string; y: string }>({ x: '', y: '' });

  const handleEditClick = (point: Point) => {
    setEditingPointId(point.id);
    setEditValues({ x: point.x.toFixed(4), y: point.y.toFixed(4) });
    onSelectPoint(point.id); // Select the point when editing starts
  };

  const handleSaveClick = (id: string) => {
    const newX = parseFloat(editValues.x);
    const newY = parseFloat(editValues.y);

    if (!isNaN(newX) && !isNaN(newY)) {
      onEditPoint(id, newX, newY);
      setEditingPointId(null);
    } else {
      // Handle invalid input, maybe show an error
      console.error("Invalid input for coordinates");
    }
  };

  const handleCancelClick = () => {
    setEditingPointId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const getMatchStatus = (pointId: string): 'matched' | 'unmatched' => {
     const matchIndex = isSourceList ? 0 : 1;
     return matchedPoints.some(pair => pair[matchIndex] === pointId) ? 'matched' : 'unmatched';
   };

  // Effect to scroll to the selected point
  useEffect(() => {
    if (selectedPointId) {
      const element = document.getElementById(`point-item-${selectedPointId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPointId]);

  return (
    <div className="flex-grow flex flex-col overflow-hidden">
      <h3 className="text-lg font-medium mb-2 text-foreground">Points</h3>
      <ScrollArea className="flex-grow border border-border rounded-md p-2">
        {points.length > 0 ? (
          <ul className="space-y-2">
            {points.map((point) => (
              <li
                key={point.id}
                id={`point-item-${point.id}`}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer border",
                  selectedPointId === point.id ? "bg-accent/20 border-accent" : "hover:bg-muted/50 border-transparent"
                )}
                onClick={() => editingPointId !== point.id && onSelectPoint(point.id === selectedPointId ? null : point.id)}
              >
                {editingPointId === point.id ? (
                  <div className="flex items-center space-x-2 flex-grow mr-2">
                     <span className="font-mono text-xs text-muted-foreground w-10 truncate">{point.id.substring(6, 11)}:</span>
                    <Input
                      type="number"
                      name="x"
                      value={editValues.x}
                      onChange={handleInputChange}
                      className="h-7 w-20 px-1 text-sm"
                      step="0.001"
                      min="0"
                      max="1"
                    />
                    <Input
                      type="number"
                      name="y"
                      value={editValues.y}
                      onChange={handleInputChange}
                      className="h-7 w-20 px-1 text-sm"
                      step="0.001"
                       min="0"
                       max="1"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 flex-grow mr-2 overflow-hidden">
                     <span className="font-mono text-xs text-muted-foreground w-10 truncate" title={`ID: ${point.id}`}>{point.id.substring(6, 11)}:</span>
                     <span className="text-sm truncate" title={`X: ${point.x}, Y: ${point.y}`}>
                       ({point.x.toFixed(3)}, {point.y.toFixed(3)})
                     </span>
                      {getMatchStatus(point.id) === 'matched' ? (
                         <CheckCircle className="h-4 w-4 text-green-500 ml-auto shrink-0" title="Matched"/>
                       ) : (
                         <XCircle className="h-4 w-4 text-muted-foreground/50 ml-auto shrink-0" title="Not Matched"/>
                       )}
                  </div>
                )}
                <div className="flex space-x-1 shrink-0">
                  {editingPointId === point.id ? (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => handleSaveClick(point.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCancelClick}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-accent hover:text-accent/80" onClick={(e) => { e.stopPropagation(); handleEditClick(point); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={(e) => { e.stopPropagation(); onDeletePoint(point.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Click on the image to add points.</p>
        )}
      </ScrollArea>
    </div>
  );
}
