import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

export interface Layer {
  id: number;
  type: 'image' | 'text' | 'shape';
  name: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  opacity: number;
  isVisible: boolean;
  zIndex: number;
  isRecolored?: boolean;
  rotation?: number;
  // Image-specific
  src?: string;
  mimeType?: string;
  filter?: string;
  // Text-specific
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  textStyles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: boolean;
  // Shape-specific
  shapeType?: 'rectangle' | 'circle' | 'star' | 'triangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  // AI detected metadata
  isAIObject?: boolean;
}

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onDelete: (id: number) => void;
}

export function LayerItem({ layer, isSelected, onSelect, onToggleVisibility, onDelete }: LayerItemProps) {
  return (
    <div 
      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
      }`}
      onClick={() => onSelect(layer.id)}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleVisibility(layer.id); 
          }}
          className="flex-shrink-0 hover:text-blue-400 transition-colors"
          aria-label={layer.isVisible ? 'Hide layer' : 'Show layer'}
        >
          {layer.isVisible ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </button>
        <span className="truncate text-sm">{layer.name}</span>
      </div>
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          onDelete(layer.id); 
        }}
        className="p-1 rounded-full hover:bg-red-500 flex-shrink-0 transition-colors"
        aria-label="Delete layer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
