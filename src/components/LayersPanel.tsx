import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Lock, Unlock, Copy, Sparkles, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Layer } from './LayerItem';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: number | null;
  onSelectLayer: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onDeleteLayer: (id: number) => void;
  onDuplicateLayer: (id: number) => void;
  onReorderLayer: (id: number, direction: 'up' | 'down') => void;
  onDetectLayers: () => void;
  onAddImageLayer: () => void;
  isDetecting?: boolean;
}

export function LayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onDuplicateLayer,
  onReorderLayer,
  onDetectLayers,
  onAddImageLayer,
  isDetecting = false,
}: LayersPanelProps) {
  const [lockedLayers, setLockedLayers] = useState<Set<number>>(new Set());

  const toggleLock = (id: number) => {
    const newLocked = new Set(lockedLayers);
    if (newLocked.has(id)) {
      newLocked.delete(id);
    } else {
      newLocked.add(id);
    }
    setLockedLayers(newLocked);
  };

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white">Layers</h3>
          <span className="text-xs text-gray-400">{layers.length} layer{layers.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onDetectLayers}
            disabled={isDetecting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isDetecting ? 'Detecting...' : 'Auto-Detect Layers'}
          </Button>
          <Button
            onClick={onDetectLayers}
            disabled={isDetecting}
            variant="outline"
            size="sm"
            className="flex-1 border-gray-700 text-gray-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isDetecting ? 'Detecting...' : 'Detect Objects (AI)'}
          </Button>
          <Button
            onClick={onAddImageLayer}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Layers List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedLayers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm mb-2">No layers yet</p>
              <p className="text-xs">
                Use "Auto-Detect Layers" to intelligently separate objects
              </p>
            </div>
          ) : (
            sortedLayers.map((layer, index) => (
              <div
                key={layer.id}
                onClick={() => !lockedLayers.has(layer.id) && onSelectLayer(layer.id)}
                className={`group relative rounded-lg p-3 cursor-pointer transition-all ${
                  selectedLayerId === layer.id
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {/* Layer Preview & Info */}
                <div className="flex items-center gap-3">
                  {/* Preview Thumbnail */}
                  <div className="w-12 h-12 rounded bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {layer.type === 'image' && layer.src && (
                      <img src={layer.src} alt={layer.name} className="w-full h-full object-cover" />
                    )}
                    {layer.type === 'text' && (
                      <span className="text-xs text-gray-400">Aa</span>
                    )}
                    {layer.type === 'shape' && layer.shapeType && (
                      <div
                        className="w-8 h-8"
                        style={{
                          backgroundColor: layer.fillColor,
                          borderRadius: layer.shapeType === 'circle' ? '50%' : '0',
                        }}
                      />
                    )}
                  </div>

                  {/* Layer Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{layer.name}</p>
                    <p className="text-xs text-gray-400">
                      {layer.type} • {Math.round(layer.opacity * 100)}% opacity
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title={layer.isVisible ? 'Hide' : 'Show'}
                    >
                      {layer.isVisible ? (
                        <Eye className="h-4 w-4 text-gray-300" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(layer.id);
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title={lockedLayers.has(layer.id) ? 'Unlock' : 'Lock'}
                    >
                      {lockedLayers.has(layer.id) ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Layer Controls - Show on hover or when selected */}
                {(selectedLayerId === layer.id || true) && (
                  <div className="mt-2 pt-2 border-t border-gray-700 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateLayer(layer.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderLayer(layer.id, 'up');
                      }}
                      disabled={index === 0}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderLayer(layer.id, 'down');
                      }}
                      disabled={index === sortedLayers.length - 1}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 hover:bg-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Tips */}
      {layers.length > 0 && (
        <div className="p-3 border-t border-gray-700 bg-gray-800">
          <p className="text-xs text-gray-400">
            💡 Click layers to select • Drag on canvas to move • Use handles to resize
          </p>
        </div>
      )}
    </div>
  );
}
