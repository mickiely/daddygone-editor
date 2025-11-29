import React, { useState } from 'react';
import { X, Maximize2, Instagram, Facebook, Linkedin, Image as ImageIcon } from 'lucide-react';

interface CanvasSizeDialogProps {
  onConfirm: (width: number, height: number, color: string) => void;
  onCancel: () => void;
  currentWidth?: number;
  currentHeight?: number;
}

const presets = [
  { name: 'Instagram Post', width: 1080, height: 1080, icon: Instagram },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: Instagram },
  { name: 'Facebook Post', width: 1200, height: 630, icon: Facebook },
  { name: 'LinkedIn Post', width: 1200, height: 627, icon: Linkedin },
  { name: 'Twitter Post', width: 1200, height: 675, icon: ImageIcon },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: ImageIcon },
  { name: 'HD (1080p)', width: 1920, height: 1080, icon: Maximize2 },
  { name: 'Custom', width: 800, height: 600, icon: Maximize2 },
];

export function CanvasSizeDialog({ onConfirm, onCancel, currentWidth, currentHeight }: CanvasSizeDialogProps) {
  const [width, setWidth] = useState(currentWidth || 1080);
  const [height, setHeight] = useState(currentHeight || 1080);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetClick = (preset: typeof presets[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setSelectedPreset(preset.name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white text-xl">Canvas Size</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Presets */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-3">Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedPreset === preset.name
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-white">{preset.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {preset.width} × {preset.height}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="my-6 bg-gray-700" />

          {/* Custom Dimensions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => {
                  setWidth(parseInt(e.target.value) || 0);
                  setSelectedPreset(null);
                }}
                min={1}
                max={10000}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(parseInt(e.target.value) || 0);
                  setSelectedPreset(null);
                }}
                min={1}
                max={10000}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Background Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-20 h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (width > 0 && height > 0) {
                onConfirm(width, height, backgroundColor);
              } else {
                alert('Please enter valid dimensions');
              }
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Create Canvas
          </button>
        </div>
      </div>
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-px ${className}`} />;
}
