import React from 'react';
import { Sun, Contrast, Palette, Zap } from 'lucide-react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  temperature: number;
  tint: number;
}

interface ColorAdjustmentsProps {
  adjustments: Adjustments;
  onAdjustmentChange: (key: keyof Adjustments, value: number) => void;
  onReset: () => void;
  onApply: () => void;
}

export function ColorAdjustments({
  adjustments,
  onAdjustmentChange,
  onReset,
  onApply,
}: ColorAdjustmentsProps) {
  const hasChanges = Object.values(adjustments).some((val, idx) => {
    const defaults = [0, 0, 0, 0, 0, 0];
    return val !== defaults[idx];
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-gray-400 flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Adjustments
        </h3>
        {hasChanges && (
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Reset All
          </Button>
        )}
      </div>

      {/* Brightness */}
      <div>
        <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
          <span>Brightness</span>
          <span className="text-white">{adjustments.brightness}</span>
        </label>
        <Slider
          value={[adjustments.brightness]}
          onValueChange={([value]) => onAdjustmentChange('brightness', value)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Contrast */}
      <div>
        <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
          <span>Contrast</span>
          <span className="text-white">{adjustments.contrast}</span>
        </label>
        <Slider
          value={[adjustments.contrast]}
          onValueChange={([value]) => onAdjustmentChange('contrast', value)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Saturation */}
      <div>
        <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
          <span>Saturation</span>
          <span className="text-white">{adjustments.saturation}</span>
        </label>
        <Slider
          value={[adjustments.saturation]}
          onValueChange={([value]) => onAdjustmentChange('saturation', value)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Hue */}
      <div>
        <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
          <span>Hue</span>
          <span className="text-white">{adjustments.hue}°</span>
        </label>
        <Slider
          value={[adjustments.hue]}
          onValueChange={([value]) => onAdjustmentChange('hue', value)}
          min={-180}
          max={180}
          step={1}
        />
      </div>

      {/* Temperature */}
      <div>
        <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
          <span>Temperature</span>
          <span className="text-white">{adjustments.temperature}</span>
        </label>
        <Slider
          value={[adjustments.temperature]}
          onValueChange={([value]) => onAdjustmentChange('temperature', value)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Tint */}
      <div>
        <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
          <span>Tint</span>
          <span className="text-white">{adjustments.tint}</span>
        </label>
        <Slider
          value={[adjustments.tint]}
          onValueChange={([value]) => onAdjustmentChange('tint', value)}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {hasChanges && (
        <Button
          onClick={onApply}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Zap className="h-4 w-4 mr-2" />
          Apply Adjustments
        </Button>
      )}
    </div>
  );
}
