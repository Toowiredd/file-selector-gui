"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  Search,
  X,
  Check,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Code,
  Database,
  EyeOff, // Icon for exclusions
  Filter,
} from "lucide-react"
import { Input } from "./ui/input" // ShadCN UI components
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Checkbox } from "./ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion" // For collapsible exclusion section
import { cn } from "../lib/utils" // Utility function

// We'll use the actual file system instead of sample data
import { useEffect } from 'react';

// Initially empty file system that will be populated with real data
const sampleFileSystem: Record<string, FileSystemItem> = {
  "/": {
    type: "directory" as const,
    name: "root",
    children: {
      Documents: {
        type: "directory" as const,
        name: "Documents",
        children: {
          Projects: {
            type: "directory" as const,
            name: "Projects",
            children: {
              website: {
                type: "directory" as const,
                name: "website",
                children: {
                  ".git": { // Example .git folder
                    type: "directory" as const,
                    name: ".git",
                    children: {
                      "config": { type: "file" as const, name: "config", size: 200 },
                      "HEAD": { type: "file" as const, name: "HEAD", size: 50 },
                    }
                  },
                  "index.html": { type: "file" as const, name: "index.html", size: 2048 },
                  "style.css": { type: "file" as const, name: "style.css", size: 1024 },
                  "script.js": { type: "file" as const, name: "script.js", size: 512 },
                  images: {
                    type: "directory" as const,
                    name: "images",
                    children: {
                      "logo.png": { type: "file" as const, name: "logo.png", size: 8192 },
                      "hero.jpg": { type: "file" as const, name: "hero.jpg", size: 32768 },
                    },
                  },
                },
              },
              "mobile-app": {
                type: "directory" as const,
                name: "mobile-app",
                children: {
                  "App.tsx": { type: "file" as const, name: "App.tsx", size: 4096 },
                  "package.json": { type: "file" as const, name: "package.json", size: 512 },
                  src: {
                    type: "directory" as const,
                    name: "src",
                    children: {
                      components: {
                        type: "directory" as const,
                        name: "components",
                        children: {
                          "Button.tsx": { type: "file" as const, name: "Button.tsx", size: 1024 },
                          "Header.tsx": { type: "file" as const, name: "Header.tsx", size: 2048 },
                        },
                      },
                    },
                  },
                  node_modules: { // Example node_modules
                    type: "directory" as const,
                    name: "node_modules",
                    children: {
                      react: {
                        type: "directory" as const,
                        name: "react",
                        children: { "index.js": { type: "file" as const, name: "index.js", size: 1000 } },
                      },
                      lodash: {
                        type: "directory" as const,
                        name: "lodash",
                        children: { "main.js": { type: "file" as const, name: "main.js", size: 2000 } },
                      },
                    },
                  },
                },
              },
            },
          },
          Reports: {
            type: "directory" as const,
            name: "Reports",
            children: {
              "Q1-2024.pdf": { type: "file" as const, name: "Q1-2024.pdf", size: 16384 },
              "Q2-2024.pdf": { type: "file" as const, name: "Q2-2024.pdf", size: 18432 },
            },
          },
        },
      },
      Media: {
        type: "directory" as const,
        name: "Media",
        children: {
          Photos: {
            type: "directory" as const,
            name: "Photos",
            children: {
              "vacation.jpg": { type: "file" as const, name: "vacation.jpg", size: 65536 },
            },
          },
        },
      },
    },
  },
}

interface FileSystemItem {
  type: "file" | "directory"
  name: string
  size?: number
  children?: Record<string, FileSystemItem>
}

interface FileSelectorProps {
  initialPath?: string
  onSelectionChange?: (selectedPaths: string[]) => void
  /** @deprecated Use smartExcludeSuggestions for common patterns or implement custom filtering if needed */
  excludedPatterns?: string[] // Kept for API compatibility, but new logic uses smartExcludeSuggestions
  smartExcludeSuggestions?: string[] // e.g., ['node_modules', '.git', 'dist']
  className?: string
  fileSystemData?: Record<string, FileSystemItem> // Allow passing custom file system data
}

// Helper to get an item from the file system by path
function getItemByPath(fsData: Record<string, FileSystemItem>, path: string): FileSystemItem | null {
  if (path === "/") return fsData["/"]
  const parts = path.split("/").filter(Boolean)
  let current: any = fsData["/"]
  if (!current) return null;


  for (const part of parts) {
    if (current?.children?.[part]) {
      current = current.children[part]
    } else {
      // If path is like "/Documents" and root is "Documents", handle this.
      if (parts.length === 1 && current.name === part && current.type === "directory") {
         // This case might be redundant if root is always "/"
      } else if (current.name === fsData["/"].name && fsData["/"].children?.[part]) {
         current = fsData["/"].children[part];
      }
      else {
        return null
      }
    }
  }
  return current as FileSystemItem
}


function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "jpg": case "jpeg": case "png": case "gif": case "svg": return <ImageIcon className="h-4 w-4 text-blue-500" />;
    case "mp3": case "wav": case "flac": return <Music className="h-4 w-4 text-green-500" />;
    case "mp4": case "avi": case "mov": return <Video className="h-4 w-4 text-purple-500" />;
    case "js": case "ts": case "jsx": case "tsx": case "html": case "css": return <Code className="h-4 w-4 text-yellow-500" />;
    case "pdf": case "doc": case "docx": case "txt": return <FileText className="h-4 w-4 text-red-500" />;
    case "zip": case "rar": case "tar": return <Archive className="h-4 w-4 text-orange-500" />;
    case "sql": case "db": return <Database className="h-4 w-4 text-indigo-500" />;
    default: return <FileIcon className="h-4 w-4 text-gray-500" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return ""
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

interface DirectoryTreeProps {
  path: string
  item: FileSystemItem
  level?: number
  selectedPaths: Set<string>
  onSelectionChange: (path: string, selected: boolean) => void
  expandedDirs: Set<string>
  onToggleExpanded: (path: string) => void
  searchTerm: string
  filteredPaths: Set<string> // Paths that match search term
  activelyExcludedPaths: Set<string> // Paths actively excluded by user
}

function DirectoryTree({
  path,
  item,
  level = 0,
  selectedPaths,
  onSelectionChange,
  expandedDirs,
  onToggleExpanded,
  searchTerm,
  filteredPaths,
  activelyExcludedPaths,
}: DirectoryTreeProps) {
  const isExpanded = expandedDirs.has(path)
  const isSelected = selectedPaths.has(path)

  // Check if this path or any of its children are part of an actively excluded directory
  const isEffectivelyExcluded = Array.from(activelyExcludedPaths).some(excludedPath => path.startsWith(excludedPath))
  if (isEffectivelyExcluded) return null

  const isVisibleBySearch = !searchTerm || filteredPaths.has(path)
  if (!isVisibleBySearch) return null

  const handleToggleExpanded = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (item.type === "directory") {
      onToggleExpanded(path)
    }
  }

  const handleSelectionChange = (checked: boolean | string) => { // Checkbox onCheckedChange can pass string "indeterminate"
    if (typeof checked === 'boolean') {
      onSelectionChange(path, checked)
    }
  }
  
  const pathDisplayName = path === "/" && item.name === "root" ? "Root Directory" : item.name;

  return (
    <div className={cn("select-none", level > 0 && "ml-4")}>
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent",
        )}
        onClick={() => handleToggleExpanded()} // Allow clicking whole row to expand/collapse
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {item.type === "directory" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={handleToggleExpanded}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}

          <Checkbox 
            checked={isSelected} 
            onCheckedChange={handleSelectionChange} 
            onClick={(e) => e.stopPropagation()} 
            aria-label={`Select ${item.name}`}
            className={item.type !== "directory" && level === 0 ? "ml-5" : ""} // Align files at root level if no chevron
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 min-w-0">
                  {item.type === "directory" ? (
                    isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )
                  ) : (
                    getFileIcon(item.name)
                  )}
                  <span className="truncate text-sm">{pathDisplayName}</span>
                  {item.size !== undefined && (
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {formatFileSize(item.size)}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{path}</p>
                {item.size !== undefined && <p>Size: {formatFileSize(item.size)}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {item.type === "directory" && isExpanded && item.children && (
        <div className="mt-1">
          {Object.entries(item.children)
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB)) // Sort entries alphabetically
            .map(([name, childItem]) => (
            <DirectoryTree
              key={name}
              path={path === "/" ? `/${name}` : `${path}/${name}`}
              item={childItem}
              level={level + 1}
              selectedPaths={selectedPaths}
              onSelectionChange={onSelectionChange}
              expandedDirs={expandedDirs}
              onToggleExpanded={onToggleExpanded}
              searchTerm={searchTerm}
              filteredPaths={filteredPaths}
              activelyExcludedPaths={activelyExcludedPaths}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const DEFAULT_SMART_EXCLUDE_SUGGESTIONS = ['node_modules', '.git', 'dist', 'build', 'vendor', 'bower_components', '.cache', '__pycache__'];

export function FileSelector({
  initialPath = "/",
  onSelectionChange,
  // excludedPatterns = [], // Original prop, less used now
  smartExcludeSuggestions = DEFAULT_SMART_EXCLUDE_SUGGESTIONS,
  className,
  fileSystemData = sampleFileSystem,
}: FileSelectorProps) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([initialPath]))
  const [searchTerm, setSearchTerm] = useState("")
  const [activelyExcludedPaths, setActivelyExcludedPaths] = useState<Set<string>>(new Set());

  const currentFileSystem = useMemo(() => fileSystemData, [fileSystemData]);
  
  const allPaths = useMemo(() => {
    const paths: string[] = []
    function traverse(item: FileSystemItem, currentPath: string) {
      paths.push(currentPath)
      if (item.type === "directory" && item.children) {
        Object.entries(item.children).forEach(([name, childItem]) => {
          traverse(childItem, currentPath === "/" ? `/${name}` : `${currentPath}/${name}`)
        })
      }
    }
    const rootItem = getItemByPath(currentFileSystem, "/");
    if (rootItem) {
      traverse(rootItem, "/")
    }
    return paths
  }, [currentFileSystem])

  const discoveredExcludeCandidates = useMemo(() => {
    const candidates = new Map<string, string>(); // path -> suggestedName
    if (!smartExcludeSuggestions || smartExcludeSuggestions.length === 0) {
      return candidates;
    }

    allPaths.forEach(p => {
      const segments = p.split('/').filter(Boolean);
      let currentPath = "";
      for (const segment of segments) {
        currentPath = currentPath === "" ? `/${segment}` : `${currentPath}/${segment}`;
        if (smartExcludeSuggestions.includes(segment)) {
          // Check if this exact path is a directory
          const item = getItemByPath(currentFileSystem, currentPath);
          if (item && item.type === 'directory' && !candidates.has(currentPath)) {
             candidates.set(currentPath, segment); // Store the path and the matching suggestion name
          }
        }
      }
    });
    return candidates;
  }, [allPaths, smartExcludeSuggestions, currentFileSystem]);

  const handleToggleSmartExclusion = (path: string, exclude: boolean) => {
    setActivelyExcludedPaths(prev => {
      const newSet = new Set(prev);
      if (exclude) {
        newSet.add(path);
      } else {
        newSet.delete(path);
      }
      // When excluding, also deselect all paths under this excluded path
      if (exclude) {
        setSelectedPaths(currentSelected => {
            const updatedSelected = new Set(currentSelected);
            currentSelected.forEach(sp => {
                if (sp.startsWith(path)) {
                    updatedSelected.delete(sp);
                }
            });
            if (onSelectionChange && updatedSelected.size !== currentSelected.size) {
              onSelectionChange(Array.from(updatedSelected));
            }
            return updatedSelected;
        });
      }
      return newSet;
    });
  };
  
  const filteredPathsAndParents = useMemo(() => {
    const pathsMatchingSearch = allPaths.filter(p => {
      const isExcluded = Array.from(activelyExcludedPaths).some(excludedPath => p.startsWith(excludedPath));
      if (isExcluded) return false;
      return !searchTerm || p.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const pathsWithParents = new Set(pathsMatchingSearch);
    if (searchTerm) { // Only add parents if there's a search term, otherwise all paths are initially visible
        pathsMatchingSearch.forEach((path) => {
        const parts = path.split("/").filter(Boolean);
        let currentParentPath = "";
        parts.forEach((part, index) => {
          if (index < parts.length -1) { // Don't add the item itself, only its parents
            currentParentPath += `/${part}`;
            if(currentParentPath !== "/") pathsWithParents.add(currentParentPath); // Add parent if not root
            else pathsWithParents.add("/"); // ensure root is added if it's a parent
          }
        });
      });
    }
    return pathsWithParents;
  }, [searchTerm, allPaths, activelyExcludedPaths]);


  const handleSelectionChange = useCallback(
    (path: string, selected: boolean) => {
      const isPathExcluded = Array.from(activelyExcludedPaths).some(excludedPath => path.startsWith(excludedPath));
      if (isPathExcluded && selected) return; // Prevent selection of explicitly excluded items

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
            
            if (isChildExcluded && shouldSelect) return; // Skip if child is part of an excluded path

            togglePath(childPath, shouldSelect);
            if (!isChildExcluded) { // Only recurse if child itself is not starting an excluded path
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
    [selectedPaths, onSelectionChange, activelyExcludedPaths, currentFileSystem],
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

  const selectionStats = useMemo(() => {
    let fileCount = 0;
    let dirCount = 0;
    let totalSize = 0;
    const fileTypes: Record<string, number> = {};

    selectedPaths.forEach((path) => {
      // Ensure we don't count anything that became excluded after selection
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

  const rootItem = getItemByPath(currentFileSystem, "/");
  const visiblePathsCount = useMemo(() => {
    return allPaths.filter(p => !Array.from(activelyExcludedPaths).some(ep => p.startsWith(ep))).length;
  }, [allPaths, activelyExcludedPaths]);


  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-[700px] bg-background text-foreground border rounded-lg shadow-sm", className)}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={activelyExcludedPaths.size === allPaths.length}>
              <Check className="h-4 w-4 mr-2" /> Select All Visible
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <X className="h-4 w-4 mr-2" /> Clear Selection
            </Button>
            <Badge variant="secondary" className="ml-auto">
              {selectedPaths.size} selected
            </Badge>
          </div>
          
          {discoveredExcludeCandidates.size > 0 && (
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="smart-exclusions">
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    Manage Suggested Exclusions ({discoveredExcludeCandidates.size})
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0 text-xs">
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {Array.from(discoveredExcludeCandidates.entries())
                      .sort(([pathA], [pathB]) => pathA.localeCompare(pathB)) // Sort for consistent order
                      .map(([path, suggestedName]) => (
                      <div key={path} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50">
                        <Checkbox
                          id={`exclude-${path.replace(/\//g, '-')}`}
                          checked={activelyExcludedPaths.has(path)}
                          onCheckedChange={(checked) => handleToggleSmartExclusion(path, !!checked)}
                        />
                        <label htmlFor={`exclude-${path.replace(/\//g, '-')}`} className="flex-1 truncate cursor-pointer">
                          Exclude <Badge variant="outline" className="mx-1 text-xs">{suggestedName}</Badge> at <code>{path}</code>
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Directory Tree */}
          <div className="flex-1 p-4 overflow-auto">
            <Card className="h-full shadow-inner">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">Directory Structure</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-2 max-h-full overflow-auto">
                  {rootItem ? (
                    <DirectoryTree
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

          {/* Selection Preview */}
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
        </div>

        {/* Status Bar */}
        <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {searchTerm ? `${filteredPathsAndParents.size} items match search` : `${visiblePathsCount} items visible`}
              {` / ${allPaths.length} total`}
            </span>
            <span>
              {activelyExcludedPaths.size > 0 && `${Array.from(activelyExcludedPaths).reduce((acc, p) => acc + allPaths.filter(ap => ap.startsWith(p)).length, 0)} items hidden by exclusion`}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Helper components (assuming these are defined elsewhere, e.g., in "@/components/ui")
// If not, you'd need to provide basic implementations or install ShadCN UI.
// For example, a basic Accordion:
// const Accordion = ({ children, ...props }) => <div {...props}>{children}</div>;
// const AccordionItem = ({ children, ...props }) => <div {...props}>{children}</div>;
// const AccordionTrigger = ({ children, ...props }) => <button {...props}>{children}</button>;
// const AccordionContent = ({ children, ...props }) => <div {...props}>{children}</div>;
