export interface FileSystemItem {
  type: "file" | "directory"
  name: string
  size?: number
  children?: Record<string, FileSystemItem>
}

export interface FileSelectorProps {
  initialPath?: string
  onSelectionChange?: (selectedPaths: string[]) => void
  /** @deprecated Use smartExcludeSuggestions for common patterns or implement custom filtering if needed */
  excludedPatterns?: string[] // Kept for API compatibility, but new logic uses smartExcludeSuggestions
  smartExcludeSuggestions?: string[] // e.g., ['node_modules', '.git', 'dist']
  className?: string
  fileSystemData?: Record<string, FileSystemItem> // Allow passing custom file system data
}
