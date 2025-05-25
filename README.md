# File Selector GUI

A modern file selection component built with React, TypeScript, and Tailwind CSS. This component provides an intuitive interface for browsing directory structures, selecting files and folders, and managing exclusions.

## Features

- Interactive directory tree navigation
- File and folder selection with checkbox controls
- Smart exclusion suggestions for common patterns (node_modules, .git, etc.)
- Search functionality to quickly find files and folders
- Responsive design with dark mode support
- File type recognition with appropriate icons

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Radix UI components
- Lucide icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

```jsx
import { FileSelector } from './components/FileSelector';

function App() {
  return (
    <div className="container">
      <FileSelector 
        initialPath="/"
        onSelectionChange={(selectedPaths) => console.log(selectedPaths)}
      />
    </div>
  );
}
```
