import React from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { Slider } from './ui/slider';

export interface FilterSettings {
  blur: number;
  sharpen: number;
  grayscale: number;
  sepia: number;
  invert: number;
  pixelate: number;
}

interface FiltersPanelProps {
  filters: FilterSettings;
  onFilterChange: (filters: FilterSettings) => void;
  onApplyPreset: (preset: string) => void;
}

const presets = [
  { id: 'none', name: 'Original', color: '#6B7280' },
  { id: 'bw', name: 'Black & White', color: '#000000' },
  { id: 'sepia', name: 'Sepia', color: '#704214' },
  { id: 'vintage', name: 'Vintage', color: '#8B4513' },
  { id: 'cool', name: 'Cool', color: '#3B82F6' },
  { id: 'warm', name: 'Warm', color: '#F59E0B' },
  { id: 'dramatic', name: 'Dramatic', color: '#1F2937' },
  { id: 'vibrant', name: 'Vibrant', color: '#EC4899' },
];

export function FiltersPanel({ filters, onFilterChange, onApplyPreset }: FiltersPanelProps) {
  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <label className="block text-sm text-gray-300 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Filter Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all group"
            >
              <div
                className="w-full h-12 rounded-md mb-2"
                style={{
                  background: `linear-gradient(135deg, ${preset.color}, ${preset.color}88)`,
                }}
              />
              <span className="text-xs text-white">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-700" />

      {/* Custom Filters */}
      <div className="space-y-4">
        <label className="block text-sm text-gray-300 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Custom Filters
        </label>

        {/* Blur */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Blur</span>
            <span className="text-xs text-gray-300">{filters.blur}px</span>
          </div>
          <Slider
            value={[filters.blur]}
            onValueChange={([value]) => onFilterChange({ ...filters, blur: value })}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Sharpen */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Sharpen</span>
            <span className="text-xs text-gray-300">{filters.sharpen}%</span>
          </div>
          <Slider
            value={[filters.sharpen]}
            onValueChange={([value]) => onFilterChange({ ...filters, sharpen: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Grayscale */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Grayscale</span>
            <span className="text-xs text-gray-300">{filters.grayscale}%</span>
          </div>
          <Slider
            value={[filters.grayscale]}
            onValueChange={([value]) => onFilterChange({ ...filters, grayscale: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Sepia */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Sepia</span>
            <span className="text-xs text-gray-300">{filters.sepia}%</span>
          </div>
          <Slider
            value={[filters.sepia]}
            onValueChange={([value]) => onFilterChange({ ...filters, sepia: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Invert */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Invert</span>
            <span className="text-xs text-gray-300">{filters.invert}%</span>
          </div>
          <Slider
            value={[filters.invert]}
            onValueChange={([value]) => onFilterChange({ ...filters, invert: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Pixelate */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Pixelate</span>
            <span className="text-xs text-gray-300">{filters.pixelate}px</span>
          </div>
          <Slider
            value={[filters.pixelate]}
            onValueChange={([value]) => onFilterChange({ ...filters, pixelate: value })}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() =>
          onFilterChange({
            blur: 0,
            sharpen: 0,
            grayscale: 0,
            sepia: 0,
            invert: 0,
            pixelate: 0,
          })
        }
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
      >
        Reset All Filters
      </button>
    </div>
  );
}
