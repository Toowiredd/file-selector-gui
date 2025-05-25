"use client"

import React from "react";

export interface FileSelectorStatusBarProps {
  searchTerm: string;
  filteredPathsAndParentsCount: number;
  visiblePathsCount: number;
  allPathsCount: number;
  activelyExcludedPaths: Set<string>;
  allPaths: string[]; // Needed for calculating items hidden by exclusion
}

const FileSelectorStatusBar: React.FC<FileSelectorStatusBarProps> = ({
  searchTerm,
  filteredPathsAndParentsCount,
  visiblePathsCount,
  allPathsCount,
  activelyExcludedPaths,
  allPaths,
}) => {
  const hiddenByExclusionCount = React.useMemo(() => {
    if (activelyExcludedPaths.size === 0) return 0;
    return Array.from(activelyExcludedPaths).reduce(
      (acc, p) => acc + allPaths.filter(ap => ap.startsWith(p)).length, 
      0
    );
  }, [activelyExcludedPaths, allPaths]);

  return (
    <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>
          {searchTerm ? `${filteredPathsAndParentsCount} items match search` : `${visiblePathsCount} items visible`}
          {` / ${allPathsCount} total`}
        </span>
        <span>
          {activelyExcludedPaths.size > 0 && `${hiddenByExclusionCount} items hidden by exclusion`}
        </span>
      </div>
    </div>
  );
};

export default FileSelectorStatusBar;
