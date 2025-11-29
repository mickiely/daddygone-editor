import React from 'react';
import { History, Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export interface RecolorLayer {
  id: string;
  color: string;
  timestamp: Date;
  imageData: string;
  isVisible: boolean;
}

interface RecolorHistoryProps {
  layers: RecolorLayer[];
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

export function RecolorHistory({ layers, onToggleVisibility, onDelete, onDownload }: RecolorHistoryProps) {
  if (layers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recolors yet</p>
        <p className="text-xs mt-1">Click on your image to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-300 px-4 pt-4">
        <History className="h-5 w-5" />
        <h3>Recolor Layers</h3>
        <span className="ml-auto text-xs text-gray-500">{layers.length}</span>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2 px-4 pb-4">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Color Swatch */}
                <div
                  className="w-10 h-10 rounded-md border border-gray-600 flex-shrink-0"
                  style={{ backgroundColor: layer.color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    Layer {layers.length - index}
                  </p>
                  <p className="text-xs text-gray-400">
                    {layer.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                    title={layer.isVisible ? 'Hide' : 'Show'}
                  >
                    {layer.isVisible ? (
                      <Eye className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => onDownload(layer.id)}
                    className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                    title="Download this layer"
                  >
                    <Download className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => onDelete(layer.id)}
                    className="p-1.5 hover:bg-red-900 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
