import React from 'react';
import { Layer } from './LayerItem';
import { AdvancedTextEditor } from './AdvancedTextEditor';
import { Slider } from './ui/slider';
import { RotateCw } from 'lucide-react';

interface PropertiesPanelProps {
  selectedLayer: Layer | undefined;
  onUpdateLayer: (id: number, props: Partial<Layer>) => void;
}

export function PropertiesPanel({ selectedLayer, onUpdateLayer }: PropertiesPanelProps) {
  if (!selectedLayer) {
    return (
      <div className="text-gray-400 text-center p-4">
        Select a layer to edit properties.
      </div>
    );
  }

  const handleChange = (prop: keyof Layer, value: any) => {
    onUpdateLayer(selectedLayer.id, { [prop]: value });
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="border-b border-gray-600 pb-2">{selectedLayer.name}</h3>
      
      {/* Common Properties */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <Slider
            value={[selectedLayer.opacity]}
            onValueChange={([value]) => handleChange('opacity', value)}
            min={0}
            max={1}
            step={0.01}
            className="flex-1"
          />
          <span className="text-sm text-gray-400 w-12 text-right">
            {Math.round(selectedLayer.opacity * 100)}%
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Position (X, Y)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={Math.round(selectedLayer.x)}
            onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
            className="w-1/2 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="X"
          />
          <input
            type="number"
            value={Math.round(selectedLayer.y)}
            onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
            className="w-1/2 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Y"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Size (W × H)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="10"
            value={Math.round(selectedLayer.width)}
            onChange={(e) => handleChange('width', parseInt(e.target.value) || 10)}
            className="w-1/2 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Width"
          />
          <input
            type="number"
            min="10"
            value={Math.round(selectedLayer.height || selectedLayer.width)}
            onChange={(e) => handleChange('height', parseInt(e.target.value) || 10)}
            className="w-1/2 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Height"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
          <RotateCw className="h-4 w-4" />
          Rotation: {selectedLayer.rotation || 0}°
        </label>
        <Slider
          value={[selectedLayer.rotation || 0]}
          onValueChange={([value]) => handleChange('rotation', value)}
          min={0}
          max={360}
          step={1}
        />
      </div>

      {/* Text-Specific Properties */}
      {selectedLayer.type === 'text' && (
        <div className="pt-4 border-t border-gray-600">
          <AdvancedTextEditor
            layer={selectedLayer}
            onUpdate={(props) => onUpdateLayer(selectedLayer.id, props)}
          />
        </div>
      )}

      {/* Shape-Specific Properties */}
      {selectedLayer.type === 'shape' && (
        <div className="pt-4 border-t border-gray-600">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Fill Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedLayer.fillColor || '#667EEA'}
                onChange={(e) => handleChange('fillColor', e.target.value)}
                className="w-12 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={selectedLayer.fillColor || '#667EEA'}
                onChange={(e) => handleChange('fillColor', e.target.value)}
                className="flex-1 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white uppercase"
                placeholder="#667EEA"
              />
            </div>
          </div>
        </div>
      )}

      {/* Image-Specific Properties */}
      {selectedLayer.type === 'image' && (
        <div className="pt-4 border-t border-gray-600 space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Filters</label>
            <select
              value={selectedLayer.filter || 'none'}
              onChange={(e) => handleChange('filter', e.target.value === 'none' ? undefined : e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="none">None</option>
              <option value="grayscale(100%)">Grayscale</option>
              <option value="sepia(100%)">Sepia</option>
              <option value="brightness(150%)">Bright</option>
              <option value="brightness(50%)">Dark</option>
              <option value="contrast(150%)">High Contrast</option>
              <option value="blur(3px)">Blur</option>
              <option value="saturate(200%)">Saturate</option>
              <option value="hue-rotate(90deg)">Hue Shift</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
