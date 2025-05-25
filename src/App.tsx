import React from 'react';
import { FileSelector } from './components/FileSelector';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          File Selector
        </h1>
        <FileSelector />
      </div>
    </div>
  );
}

export default App;
