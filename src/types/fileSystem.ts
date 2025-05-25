export interface FileSystemItem {
  type: "file" | "directory";
  name: string;
  size?: number;
  children?: Record<string, FileSystemItem>;
}

export interface FileSelectorProps {
  initialPath?: string;
  onSelectionChange?: (selectedPaths: string[]) => void;
  excludedPatterns?: string[];
  smartExcludeSuggestions?: string[];
  className?: string;
  fileSystemData?: Record<string, FileSystemItem>;
}
