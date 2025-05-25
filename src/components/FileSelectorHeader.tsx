"use client"

import React from "react";
import { Search, X, Check, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Checkbox } from "./ui/checkbox";

export interface FileSelectorHeaderProps {
  searchTerm: string;
  onSearchTermChange: (newSearchTerm: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  selectedPathsCount: number; // Added to display count on badge
  discoveredExcludeCandidates: Map<string, string>;
  activelyExcludedPaths: Set<string>;
  onToggleSmartExclusion: (path: string, exclude: boolean) => void;
  allPathsCount: number; 
}

const FileSelectorHeader: React.FC<FileSelectorHeaderProps> = ({
  searchTerm,
  onSearchTermChange,
  onSelectAll,
  onClearAll,
  selectedPathsCount,
  discoveredExcludeCandidates,
  activelyExcludedPaths,
  onToggleSmartExclusion,
  allPathsCount,
}) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => onSearchTermChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={onSelectAll} disabled={activelyExcludedPaths.size === allPathsCount && allPathsCount > 0}>
          <Check className="h-4 w-4 mr-2" /> Select All Visible
        </Button>
        <Button variant="outline" size="sm" onClick={onClearAll}>
          <X className="h-4 w-4 mr-2" /> Clear Selection
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {selectedPathsCount} selected
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
                  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB)) 
                  .map(([path, suggestedName]) => (
                  <div key={path} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50">
                    <Checkbox
                      id={`exclude-${path.replace(/\//g, '-')}`}
                      checked={activelyExcludedPaths.has(path)}
                      onCheckedChange={(checked) => onToggleSmartExclusion(path, !!checked)}
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
  );
};

export default FileSelectorHeader;
