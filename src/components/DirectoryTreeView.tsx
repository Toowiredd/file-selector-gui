"use client"

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Music,
  Video,
  Code,
  FileText,
  Archive,
  Database,
} from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "../lib/utils";
import type { FileSystemItem } from "../types/fileSelector";

// Helper to get file icon
function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
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

// Helper to format file size
function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Props for DirectoryTreeView
export interface DirectoryTreeProps {
  path: string;
  item: FileSystemItem;
  level?: number;
  selectedPaths: Set<string>;
  onSelectionChange: (path: string, selected: boolean) => void;
  expandedDirs: Set<string>;
  onToggleExpanded: (path: string) => void;
  searchTerm: string;
  filteredPaths: Set<string>; // Paths that match search term
  activelyExcludedPaths: Set<string>; // Paths actively excluded by user
}

const DirectoryTreeView: React.FC<DirectoryTreeProps> = ({
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
}) => {
  const isExpanded = expandedDirs.has(path);
  const isSelected = selectedPaths.has(path);

  const isEffectivelyExcluded = Array.from(activelyExcludedPaths).some(excludedPath => path.startsWith(excludedPath));
  if (isEffectivelyExcluded) return null;

  const isVisibleBySearch = !searchTerm || filteredPaths.has(path);
  if (!isVisibleBySearch) return null;

  const handleToggleExpanded = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item.type === "directory") {
      onToggleExpanded(path);
    }
  };

  const handleSelectionChange = (checked: boolean | string) => {
    if (typeof checked === 'boolean') {
      onSelectionChange(path, checked);
    }
  };
  
  const pathDisplayName = path === "/" && item.name === "root" ? "Root Directory" : item.name;

  return (
    <div className={cn("select-none", level > 0 && "ml-4")}>
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent",
        )}
        onClick={() => handleToggleExpanded()}
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
            className={item.type !== "directory" && level === 0 ? "ml-5" : ""}
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
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
            .map(([name, childItem]) => (
            <DirectoryTreeView
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
  );
};

export default DirectoryTreeView;
