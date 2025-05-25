"use client"

import React, { useState, useMemo, useCallback } from "react"; // Removed useEffect
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Retained for DirectoryTreeView wrapper
import { TooltipProvider } from "./ui/tooltip"; // Main provider
import { cn } from "../lib/utils";
import type { FileSystemItem, FileSelectorProps } from "../types/fileSelector";
import DirectoryTreeView from "./DirectoryTreeView";
import FileSelectorHeader from "./FileSelectorHeader";
import SelectionSummary from "./SelectionSummary";
import FileSelectorStatusBar from "./FileSelectorStatusBar";

// Helper to get an item from the file system by path (remains as it's used by logic within FileSelector)
function getItemByPath(fsData: Record<string, FileSystemItem>, path: string): FileSystemItem | null {
  if (path === "/") return fsData["/"];
  const parts = path.split("/").filter(Boolean);
  let current: any = fsData["/"]; // Start with root
  if (!current) return null;

  for (const part of parts) {
    if (current?.children?.[part]) {
      current = current.children[part];
    } else {
      // This handles cases where the root itself might be named differently than "/"
      // e.g. if fsData is {"myRoot": { type: "directory", ...}} and path is "/myRoot/file.txt"
      // However, given the default prop for fileSystemData = {"/": { type: "directory", name: "root", children: {} } }
      // this specific else-if might be less critical, but kept for robustness with custom fsData.
      if (parts.length === 1 && current.name === part && current.type === "directory") {
        // Path is just the root's name, current is already the root.
      } else if (fsData["/"]?.name === parts[0] && fsData["/"]?.children?.[part]) { 
        // This condition seems unlikely given typical path structures starting with "/"
        // and getItemByPath usually being called with paths like "/foo/bar"
        // If fsData has a root named "root" under "/", this might be trying to access fsData["/"].children[part]
        // This part of the logic might need review based on expected fsData structures if issues arise.
        // For now, assuming standard fsData["/"] as the entry.
         current = fsData["/"].children[part];
      }
      else {
        return null;
      }
    }
  }
  return current as FileSystemItem;
}

// Kept formatFileSize as it's passed as a prop to SelectionSummary
function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const DEFAULT_SMART_EXCLUDE_SUGGESTIONS = ['node_modules', '.git', 'dist', 'build', 'vendor', 'bower_components', '.cache', '__pycache__'];

export function FileSelector({
  initialPath = "/",
  onSelectionChange,
  smartExcludeSuggestions = DEFAULT_SMART_EXCLUDE_SUGGESTIONS,
  className,
  fileSystemData = {"/": { type: "directory", name: "root", children: {} } },
}: FileSelectorProps) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([initialPath]));
  const [searchTerm, setSearchTerm] = useState("");
  const [activelyExcludedPaths, setActivelyExcludedPaths] = useState<Set<string>>(new Set());

  const currentFileSystem = useMemo(() => fileSystemData, [fileSystemData]);

  const allPaths = useMemo(() => {
    const paths: string[] = [];
    function traverse(item: FileSystemItem, currentPath: string) {
      paths.push(currentPath);
      if (item.type === "directory" && item.children) {
        Object.entries(item.children).forEach(([name, childItem]) => {
          traverse(childItem, currentPath === "/" ? `/${name}` : `${currentPath}/${name}`);
        });
      }
    }
    const rootItemInternal = getItemByPath(currentFileSystem, "/");
    if (rootItemInternal) {
      traverse(rootItemInternal, "/");
    }
    return paths;
  }, [currentFileSystem]);

  const discoveredExcludeCandidates = useMemo(() => {
    const candidates = new Map<string, string>();
    if (!smartExcludeSuggestions || smartExcludeSuggestions.length === 0) {
      return candidates;
    }
    allPaths.forEach(p => {
      const segments = p.split('/').filter(Boolean);
      let currentPathAccumulator = "";
      for (const segment of segments) {
        currentPathAccumulator = currentPathAccumulator === "" ? `/${segment}` : `${currentPathAccumulator}/${segment}`;
        if (smartExcludeSuggestions.includes(segment)) {
          const item = getItemByPath(currentFileSystem, currentPathAccumulator);
          if (item && item.type === 'directory' && !candidates.has(currentPathAccumulator)) {
             candidates.set(currentPathAccumulator, segment);
          }
        }
      }
    });
    return candidates;
  }, [allPaths, smartExcludeSuggestions, currentFileSystem]);

  const handleToggleSmartExclusion = useCallback((path: string, exclude: boolean) => {
    setActivelyExcludedPaths(prev => {
      const newSet = new Set(prev);
      if (exclude) newSet.add(path);
      else newSet.delete(path);
      
      if (exclude) {
        setSelectedPaths(currentSelected => {
          const updatedSelected = new Set(currentSelected);
          currentSelected.forEach(sp => {
            if (sp.startsWith(path)) updatedSelected.delete(sp);
          });
          if (onSelectionChange && updatedSelected.size !== currentSelected.size) {
            onSelectionChange(Array.from(updatedSelected));
          }
          return updatedSelected;
        });
      }
      return newSet;
    });
  }, [onSelectionChange]);

  const filteredPathsAndParents = useMemo(() => {
    const pathsMatchingSearch = allPaths.filter(p => {
      const isExcluded = Array.from(activelyExcludedPaths).some(excludedPath => p.startsWith(excludedPath));
      if (isExcluded) return false;
      return !searchTerm || p.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const pathsWithParents = new Set(pathsMatchingSearch);
    if (searchTerm) {
      pathsMatchingSearch.forEach((path) => {
        const parts = path.split("/").filter(Boolean);
        let currentParentPath = "";
        parts.forEach((part, index) => {
          if (index < parts.length -1) {
            currentParentPath += `/${part}`;
            if(currentParentPath !== "/") pathsWithParents.add(currentParentPath);
            else pathsWithParents.add("/"); 
          }
        });
      });
    }
    return pathsWithParents;
  }, [searchTerm, allPaths, activelyExcludedPaths]);

  const handleSelectionChange = useCallback(
    (path: string, selected: boolean) => {
      const isPathExcluded = Array.from(activelyExcludedPaths).some(excludedPath => path.startsWith(excludedPath));
      if (isPathExcluded && selected) return;

      const newSelectedPaths = new Set(selectedPaths);
      function togglePath(targetPath: string, shouldSelect: boolean) {
        const isTargetPathExcluded = Array.from(activelyExcludedPaths).some(excludedPath => targetPath.startsWith(excludedPath));
        if (isTargetPathExcluded && shouldSelect) return;
        if (shouldSelect) newSelectedPaths.add(targetPath);
        else newSelectedPaths.delete(targetPath);
      }
      
      function getItem(itemPath: string): FileSystemItem | null {
        return getItemByPath(currentFileSystem, itemPath);
      }

      function selectChildren(parentPath: string, shouldSelect: boolean) {
        const item = getItem(parentPath);
        if (item?.type === "directory" && item.children) {
          Object.keys(item.children).forEach((childName) => {
            const childPath = parentPath === "/" ? `/${childName}` : `${parentPath}/${childName}`;
            const isChildExcluded = Array.from(activelyExcludedPaths).some(ep => childPath.startsWith(ep));
            if (isChildExcluded && shouldSelect) return;
            togglePath(childPath, shouldSelect);
            if (!isChildExcluded) {
                selectChildren(childPath, shouldSelect);
            }
          });
        }
      }

      togglePath(path, selected);
      selectChildren(path, selected);
      setSelectedPaths(newSelectedPaths);
      onSelectionChange?.(Array.from(newSelectedPaths));
    },
    [selectedPaths, onSelectionChange, activelyExcludedPaths, currentFileSystem]
  );

  const handleToggleExpanded = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) newExpanded.delete(path);
      else newExpanded.add(path);
      return newExpanded;
    });
  }, []);

  const handleSelectAll = () => {
    const newSelectedPaths = new Set(
      allPaths.filter(p => !Array.from(activelyExcludedPaths).some(ep => p.startsWith(ep)))
    );
    setSelectedPaths(newSelectedPaths);
    onSelectionChange?.(Array.from(newSelectedPaths));
  };

  const handleClearAll = () => {
    setSelectedPaths(new Set());
    onSelectionChange?.([]);
  };
  
  const rootItem = getItemByPath(currentFileSystem, "/");
  const visiblePathsCount = useMemo(() => {
    return allPaths.filter(p => !Array.from(activelyExcludedPaths).some(ep => p.startsWith(ep))).length;
  }, [allPaths, activelyExcludedPaths]);

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-[700px] bg-background text-foreground border rounded-lg shadow-sm", className)}>
        <FileSelectorHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          selectedPathsCount={selectedPaths.size}
          discoveredExcludeCandidates={discoveredExcludeCandidates}
          activelyExcludedPaths={activelyExcludedPaths}
          onToggleSmartExclusion={handleToggleSmartExclusion}
          allPathsCount={allPaths.length}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            <Card className="h-full shadow-inner">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">Directory Structure</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-2 max-h-full overflow-auto">
                  {rootItem ? (
                    <DirectoryTreeView
                      path="/"
                      item={rootItem}
                      selectedPaths={selectedPaths}
                      onSelectionChange={handleSelectionChange}
                      expandedDirs={expandedDirs}
                      onToggleExpanded={handleToggleExpanded}
                      searchTerm={searchTerm}
                      filteredPaths={filteredPathsAndParents}
                      activelyExcludedPaths={activelyExcludedPaths}
                    />
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">No file system data loaded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <SelectionSummary
            selectedPaths={selectedPaths}
            activelyExcludedPaths={activelyExcludedPaths}
            currentFileSystem={currentFileSystem}
            formatFileSize={formatFileSize}
          />
        </div>
        <FileSelectorStatusBar
          searchTerm={searchTerm}
          filteredPathsAndParentsCount={filteredPathsAndParents.size}
          visiblePathsCount={visiblePathsCount}
          allPathsCount={allPaths.length}
          activelyExcludedPaths={activelyExcludedPaths}
          allPaths={allPaths}
        />
      </div>
    </TooltipProvider>
  );
}
