import React from 'react';
import { Paintbrush, Eraser, Droplet, Wand2, Type, Crop, Trash2, Sparkles, Scan, Pipette, Sticker } from 'lucide-react';
import { Slider } from './ui/slider';

export type Tool = 'brush' | 'eraser' | 'fill' | 'colorize' | 'text' | 'crop' | 'remove' | 'bgremove' | 'magicremove' | 'eyedropper' | 'sticker';

interface ColorToolsProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  tolerance?: number;
  onToleranceChange?: (tolerance: number) => void;
  hideToolGrid?: boolean;
}

const TOOLS = [
  { type: 'brush' as const, icon: Paintbrush, label: 'Brush', description: 'Paint with color' },
  { type: 'eraser' as const, icon: Eraser, label: 'Eraser', description: 'Remove color' },
  { type: 'fill' as const, icon: Droplet, label: 'Fill', description: 'Fill similar colors' },
  { type: 'eyedropper' as const, icon: Pipette, label: 'Eyedropper', description: 'Pick color from image' },
  { type: 'colorize' as const, icon: Wand2, label: 'Colorize', description: 'Replace color' },
  { type: 'sticker' as const, icon: Sticker, label: 'Lift Sticker', description: 'Extract object as sticker' },
  { type: 'magicremove' as const, icon: Scan, label: 'Magic Erase', description: 'Click to remove objects' },
  { type: 'text' as const, icon: Type, label: 'Text', description: 'Add text boxes' },
  { type: 'crop' as const, icon: Crop, label: 'Crop', description: 'Crop image' },
  { type: 'remove' as const, icon: Trash2, label: 'Remove', description: 'Paint to remove' },
  { type: 'bgremove' as const, icon: Sparkles, label: 'Bg Remove', description: 'Auto remove bg' },
];

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#000000',
  '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#FFFFFF',
];

export function ColorTools({
  selectedTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  opacity,
  onOpacityChange,
  selectedColor,
  onColorChange,
  hideToolGrid,
}: ColorToolsProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Tools */}
      {!hideToolGrid && (
        <div>
          <h3 className="text-sm text-gray-400 mb-3">Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.type}
                onClick={() => onToolChange(tool.type)}
                className={`p-3 rounded-lg transition-all ${
                  selectedTool === tool.type
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title={tool.description}
              >
                <tool.icon className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs">{tool.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show color/brush tools only for relevant tools */}
      {!['text', 'crop', 'remove', 'bgremove', 'magicremove', 'eyedropper', 'sticker'].includes(selectedTool) && (
        <>

      {/* Color Selection */}
      <div>
        <h3 className="text-sm text-gray-400 mb-3">Color</h3>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-full aspect-square rounded-md transition-all hover:scale-110 ${
                selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-16 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white uppercase font-mono text-sm"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
      </div>

      {/* Brush Size */}
      <div>
        <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
          <span>Brush Size</span>
          <span className="text-white">{brushSize}px</span>
        </label>
        <Slider
          value={[brushSize]}
          onValueChange={([value]) => onBrushSizeChange(value)}
          min={1}
          max={100}
          step={1}
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
          <span>Opacity</span>
          <span className="text-white">{Math.round(opacity * 100)}%</span>
        </label>
        <Slider
          value={[opacity]}
          onValueChange={([value]) => onOpacityChange(value)}
          min={0}
          max={1}
          step={0.01}
        />
      </div>

      {/* Tolerance slider for magic remove tool */}
      {selectedTool === 'magicremove' && (
        <div>
          <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
            <span>Sensitivity</span>
            <span className="text-white">{tolerance || 30}</span>
          </label>
          <Slider
            value={[tolerance || 30]}
            onValueChange={([value]) => onToleranceChange?.(value)}
            min={5}
            max={100}
            step={5}
          />
          <p className="text-xs text-gray-400 mt-2">
            Higher = removes more similar colors
          </p>
        </div>
      )}

      {/* Tool Tips */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-400">
          {selectedTool === 'brush' && '🖌️ Click and drag to paint with the selected color'}
          {selectedTool === 'eraser' && '🧹 Click and drag to erase painted areas'}
          {selectedTool === 'fill' && '💧 Click to fill similar colored regions'}
          {selectedTool === 'eyedropper' && '💧 Click anywhere on the image to pick that color'}
          {selectedTool === 'colorize' && '✨ Click and drag to replace colors in that area'}
          {selectedTool === 'sticker' && '✂️ Click to select object, refine edges, then download as sticker'}
          {selectedTool === 'magicremove' && '🔍 Click on object to remove connected area'}
          {selectedTool === 'text' && '📝 Click on canvas to add text boxes'}
          {selectedTool === 'crop' && '✂️ Drag to select crop area, then click Apply'}
          {selectedTool === 'remove' && '🗑️ Paint over objects to remove them'}
          {selectedTool === 'bgremove' && '🌟 Automatically detect and remove background'}
        </p>
      </div>
        </>
      )}
    </div>
  );
}
