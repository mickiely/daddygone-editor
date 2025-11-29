import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: 'B', description: 'Brush Tool' },
    { key: 'E', description: 'Eraser Tool' },
    { key: 'T', description: 'Text Tool' },
    { key: 'C', description: 'Crop Tool' },
    { key: 'I', description: 'Eyedropper Tool' },
    { key: 'Ctrl/⌘ + Z', description: 'Undo' },
    { key: 'Ctrl/⌘ + Shift + Z', description: 'Redo' },
    { key: 'Ctrl/⌘ + Y', description: 'Redo (alternative)' },
    { key: 'Ctrl/⌘ + S', description: 'Download Image' },
    { key: '?', description: 'Show Keyboard Shortcuts' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-6 w-6 text-blue-400" />
            <h2 className="text-white text-xl">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <span className="text-gray-300">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-gray-900 text-white rounded border border-gray-600 font-mono text-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-400">
            Press <kbd className="px-2 py-1 bg-gray-700 rounded text-white">?</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}
