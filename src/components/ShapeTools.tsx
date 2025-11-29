import React from 'react';
import { Square, Circle, Star, Triangle } from 'lucide-react';

interface ShapeToolsProps {
  onAddShape: (shape: 'rectangle' | 'circle' | 'star' | 'triangle', color: string) => void;
}

export function ShapeTools({ onAddShape }: ShapeToolsProps) {
  const [selectedColor, setSelectedColor] = React.useState('#667EEA');

  const shapes = [
    { type: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { type: 'circle' as const, icon: Circle, label: 'Circle' },
    { type: 'star' as const, icon: Star, label: 'Star' },
    { type: 'triangle' as const, icon: Triangle, label: 'Triangle' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-300 mb-2">Shape Color</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {shapes.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => onAddShape(type, selectedColor)}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-2"
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
