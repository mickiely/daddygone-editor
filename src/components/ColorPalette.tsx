import React from 'react';
import { Palette, Sparkles } from 'lucide-react';

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Brown', value: '#92400E' },
  { name: 'Gold', value: '#F59E0B' },
  { name: 'Silver', value: '#D1D5DB' },
];

export function ColorPalette({ selectedColor, onColorChange }: ColorPaletteProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-300">
        <Palette className="h-5 w-5" />
        <h3>Select New Color</h3>
      </div>

      {/* Preset Colors */}
      <div className="grid grid-cols-4 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={`group relative aspect-square rounded-lg transition-all hover:scale-105 ${
              selectedColor === color.value ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium px-2 py-1 bg-black bg-opacity-75 rounded text-white">
                {color.name}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Custom Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-16 h-12 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white uppercase font-mono"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-blue-200">AI Color Change</p>
            <p className="text-xs text-blue-300">
              Click on any element in your image to intelligently recolor it with the selected color.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
