import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface FontSelectorProps {
  currentFont: string;
  onSelect: (font: string) => void;
}

const DEFAULT_FONT_CATEGORIES = {
  'Sans Serif': [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
  ],
  'Serif': [
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Garamond', value: 'Garamond, serif' },
    { name: 'Palatino', value: 'Palatino, serif' },
  ],
  'Monospace': [
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Monaco', value: 'Monaco, monospace' },
    { name: 'Consolas', value: 'Consolas, monospace' },
  ],
  'Display': [
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
    { name: 'Brush Script MT', value: '"Brush Script MT", cursive' },
  ],
};

export function FontSelector({ currentFont, onSelect }: FontSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; value: string }>>([]);
  const [showAddFont, setShowAddFont] = useState(false);
  const [newFontName, setNewFontName] = useState('');

  // Combine default and custom fonts
  const FONT_CATEGORIES = {
    ...DEFAULT_FONT_CATEGORIES,
    ...(customFonts.length > 0 ? { 'Custom': customFonts } : {}),
  };

  const allFonts = Object.values(FONT_CATEGORIES).flat();
  const filteredFonts = searchTerm
    ? allFonts.filter(font => font.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;

  const handleAddCustomFont = () => {
    if (newFontName.trim()) {
      const fontValue = `"${newFontName.trim()}", sans-serif`;
      setCustomFonts([...customFonts, { name: newFontName.trim(), value: fontValue }]);
      onSelect(fontValue);
      setNewFontName('');
      setShowAddFont(false);
    }
  };

  const renderFonts = (fonts: typeof allFonts) => (
    <div className="space-y-1">
      {fonts.map((font) => (
        <button
          key={font.value}
          onClick={() => onSelect(font.value)}
          className={`w-full text-left p-2 rounded hover:bg-gray-700 transition-colors flex items-center justify-between ${
            currentFont === font.value ? 'bg-gray-700' : ''
          }`}
          style={{ fontFamily: font.value }}
        >
          <span className="text-white">{font.name}</span>
          {currentFont === font.value && <Check className="h-4 w-4 text-blue-500" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search fonts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {showAddFont ? (
        <div className="p-3 bg-gray-800 rounded-lg space-y-2">
          <Input
            type="text"
            placeholder="Enter font name (e.g., Montserrat)"
            value={newFontName}
            onChange={(e) => setNewFontName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomFont()}
            className="bg-gray-700 border-gray-600 text-white"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddCustomFont}
              size="sm"
              className="flex-1"
              disabled={!newFontName.trim()}
            >
              Add Font
            </Button>
            <Button
              onClick={() => {
                setShowAddFont(false);
                setNewFontName('');
              }}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Note: The font must be installed on your system or loaded via web fonts
          </p>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddFont(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Font
        </Button>
      )}

      <ScrollArea className="h-64">
        {filteredFonts ? (
          renderFonts(filteredFonts)
        ) : (
          <div className="space-y-4">
            {Object.entries(FONT_CATEGORIES).map(([category, fonts]) => (
              <div key={category}>
                <h4 className="text-xs text-gray-400 mb-2 px-2">{category}</h4>
                {renderFonts(fonts)}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
