"use client"

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import type { FileSystemItem } from "../types/fileSelector"; // Adjusted path

// Helper to get an item from the file system by path (copied from FileSelector.tsx)
function getItemByPath(fsData: Record<string, FileSystemItem>, path: string): FileSystemItem | null {
  if (path === "/") return fsData["/"];
  const parts = path.split("/").filter(Boolean);
  let current: any = fsData["/"];
  if (!current) return null;

  for (const part of parts) {
    if (current?.children?.[part]) {
      current = current.children[part];
    } else {
      if (parts.length === 1 && current.name === part && current.type === "directory") {
        // This case might be redundant if root is always "/"
      } else if (current.name === fsData["/"].name && fsData["/"].children?.[part]) {
         current = fsData["/"].children[part];
      } else {
        return null;
      }
    }
  }
  return current as FileSystemItem;
}

export interface SelectionSummaryProps {
  selectedPaths: Set<string>;
  activelyExcludedPaths: Set<string>;
  currentFileSystem: Record<string, FileSystemItem>;
  formatFileSize: (bytes?: number) => string;
}

const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  selectedPaths,
  activelyExcludedPaths,
  currentFileSystem,
  formatFileSize,
}) => {
  const selectionStats = useMemo(() => {
    let fileCount = 0;
    let dirCount = 0;
    let totalSize = 0;
    const fileTypes: Record<string, number> = {};

    selectedPaths.forEach((path) => {
      if (Array.from(activelyExcludedPaths).some(ep => path.startsWith(ep))) return;

      const item = getItemByPath(currentFileSystem, path);
      if (item) {
        if (item.type === "file") {
          fileCount++;
          if (item.size) totalSize += item.size;
          const ext = item.name.split(".").pop()?.toLowerCase() || "other";
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        } else {
          dirCount++;
        }
      }
    });
    return { fileCount, dirCount, totalSize, fileTypes };
  }, [selectedPaths, activelyExcludedPaths, currentFileSystem]);

  return (
    <div className="w-80 p-4 border-l overflow-auto bg-muted/30">
      <Card className="h-full shadow-inner">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-base">Selection Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Files:</span><span className="font-medium">{selectionStats.fileCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Directories:</span><span className="font-medium">{selectionStats.dirCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Size:</span><span className="font-medium">{formatFileSize(selectionStats.totalSize)}</span></div>
          </div>

          {Object.keys(selectionStats.fileTypes).length > 0 && <Separator />}

          {Object.keys(selectionStats.fileTypes).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5 text-muted-foreground">File Types</h4>
              <div className="space-y-1 max-h-24 overflow-auto pr-1">
                {Object.entries(selectionStats.fileTypes)
                  .sort(([extA], [extB]) => extA.localeCompare(extB))
                  .map(([ext, count]) => (
                  <div key={ext} className="flex justify-between">
                    <span className="text-muted-foreground truncate">.{ext}:</span>
                    <Badge variant="outline" className="text-xs font-normal">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPaths.size > 0 && <Separator />}
          {selectedPaths.size > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5 text-muted-foreground">Selected Items ({selectedPaths.size > 10 ? "Top 10" : selectedPaths.size})</h4>
              <div className="space-y-0.5 max-h-36 overflow-auto pr-1 text-xs">
                {Array.from(selectedPaths).sort().slice(0, 10).map((path) => (
                    <div key={path} className="text-muted-foreground truncate" title={path}>{path}</div>
                  ))}
                {selectedPaths.size > 10 && (
                  <div className="italic text-muted-foreground/70">... and {selectedPaths.size - 10} more</div>
                )}
              </div>
            </div>
          )}
           {selectedPaths.size === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No items selected.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectionSummary;
