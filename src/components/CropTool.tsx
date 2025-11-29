import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './ui/button';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropToolProps {
  canvasWidth: number;
  canvasHeight: number;
  onCrop: (cropArea: CropArea) => void;
  onCancel: () => void;
  scale: number;
}

export function CropTool({ canvasWidth, canvasHeight, onCrop, onCancel, scale }: CropToolProps) {
  const [cropArea, setCropArea] = useState<CropArea>({
    x: canvasWidth * 0.1,
    y: canvasHeight * 0.1,
    width: canvasWidth * 0.8,
    height: canvasHeight * 0.8,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | string) => {
    e.stopPropagation();
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(action);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        setCropArea(prev => ({
          ...prev,
          x: Math.max(0, Math.min(canvasWidth - prev.width, prev.x + deltaX)),
          y: Math.max(0, Math.min(canvasHeight - prev.height, prev.y + deltaY)),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        setCropArea(prev => {
          let newArea = { ...prev };

          switch (isResizing) {
            case 'nw':
              newArea.x = Math.max(0, prev.x + deltaX);
              newArea.y = Math.max(0, prev.y + deltaY);
              newArea.width = prev.width - deltaX;
              newArea.height = prev.height - deltaY;
              break;
            case 'ne':
              newArea.y = Math.max(0, prev.y + deltaY);
              newArea.width = prev.width + deltaX;
              newArea.height = prev.height - deltaY;
              break;
            case 'sw':
              newArea.x = Math.max(0, prev.x + deltaX);
              newArea.width = prev.width - deltaX;
              newArea.height = prev.height + deltaY;
              break;
            case 'se':
              newArea.width = prev.width + deltaX;
              newArea.height = prev.height + deltaY;
              break;
            case 'n':
              newArea.y = Math.max(0, prev.y + deltaY);
              newArea.height = prev.height - deltaY;
              break;
            case 's':
              newArea.height = prev.height + deltaY;
              break;
            case 'w':
              newArea.x = Math.max(0, prev.x + deltaX);
              newArea.width = prev.width - deltaX;
              break;
            case 'e':
              newArea.width = prev.width + deltaX;
              break;
          }

          // Ensure minimum size
          newArea.width = Math.max(50, Math.min(canvasWidth - newArea.x, newArea.width));
          newArea.height = Math.max(50, Math.min(canvasHeight - newArea.y, newArea.height));

          return newArea;
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, scale, canvasWidth, canvasHeight]);

  return (
    <>
      {/* Crop Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Darkened areas outside crop */}
        <div
          className="absolute bg-black bg-opacity-50"
          style={{ top: 0, left: 0, width: '100%', height: cropArea.y }}
        />
        <div
          className="absolute bg-black bg-opacity-50"
          style={{ top: cropArea.y, left: 0, width: cropArea.x, height: cropArea.height }}
        />
        <div
          className="absolute bg-black bg-opacity-50"
          style={{
            top: cropArea.y,
            left: cropArea.x + cropArea.width,
            width: canvasWidth - (cropArea.x + cropArea.width),
            height: cropArea.height,
          }}
        />
        <div
          className="absolute bg-black bg-opacity-50"
          style={{
            top: cropArea.y + cropArea.height,
            left: 0,
            width: '100%',
            height: canvasHeight - (cropArea.y + cropArea.height),
          }}
        />

        {/* Crop area border */}
        <div
          className="absolute border-2 border-white pointer-events-auto cursor-move"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {/* Resize handles */}
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-nw-resize -top-1.5 -left-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-n-resize -top-1.5 left-1/2 -ml-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-ne-resize -top-1.5 -right-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-w-resize top-1/2 -mt-1.5 -left-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-e-resize top-1/2 -mt-1.5 -right-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-sw-resize -bottom-1.5 -left-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-s-resize -bottom-1.5 left-1/2 -ml-1.5"
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          <div
            className="absolute w-3 h-3 bg-white rounded-full cursor-se-resize -bottom-1.5 -right-1.5"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white border-opacity-30" />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="bg-gray-900 bg-opacity-75 backdrop-blur"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={() => onCrop(cropArea)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply Crop
        </Button>
      </div>

      {/* Crop info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 backdrop-blur px-4 py-2 rounded-lg text-sm text-white z-10">
        {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
      </div>
    </>
  );
}
