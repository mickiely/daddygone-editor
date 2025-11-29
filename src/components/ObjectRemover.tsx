import React, { useState, useRef, useEffect } from 'react';
import { Eraser, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface Point {
  x: number;
  y: number;
}

interface ObjectRemoverProps {
  canvas: HTMLCanvasElement;
  scale: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function ObjectRemover({ canvas, scale, onComplete, onCancel }: ObjectRemoverProps) {
  const [brushSize, setBrushSize] = useState(30);
  const [maskPath, setMaskPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.width = canvas.width;
      overlayRef.current.height = canvas.height;
      drawMask();
    }
  }, [maskPath, canvas.width, canvas.height]);

  const drawMask = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    if (maskPath.length > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;

      maskPath.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };

    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    setMaskPath([...maskPath, { x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    setMaskPath([...maskPath, { x, y }]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handlePanelMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPanel(true);
    setDragOffset({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y,
    });
  };

  const handlePanelMouseMove = (e: MouseEvent) => {
    if (!isDraggingPanel) return;
    setPanelPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handlePanelMouseUp = () => {
    setIsDraggingPanel(false);
  };

  useEffect(() => {
    if (isDraggingPanel) {
      window.addEventListener('mousemove', handlePanelMouseMove);
      window.addEventListener('mouseup', handlePanelMouseUp);
      return () => {
        window.removeEventListener('mousemove', handlePanelMouseMove);
        window.removeEventListener('mouseup', handlePanelMouseUp);
      };
    }
  }, [isDraggingPanel, dragOffset]);

  const applyRemoval = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);

    // Create mask of all pixels to remove
    const mask = new Set<string>();
    maskPath.forEach(point => {
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= brushSize / 2) {
            const x = Math.floor(point.x + dx);
            const y = Math.floor(point.y + dy);
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
              mask.add(`${x},${y}`);
            }
          }
        }
      }
    });

    // Smart background sampling - perimeter only, avoid dark colors
    const backgroundSamples: number[][] = [];
    const coords = Array.from(mask).map(k => k.split(',').map(Number));
    
    // Find perimeter pixels (border the mask area)
    const perimeterPixels: [number, number][] = [];
    for (const [x, y] of coords) {
      const neighbors = [
        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
      ];
      const isPerimeter = neighbors.some(([nx, ny]) => {
        const nkey = `${nx},${ny}`;
        return !mask.has(nkey) && nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height;
      });
      
      if (isPerimeter) {
        perimeterPixels.push([x, y]);
      }
    }

    // Sample outward from perimeter only
    for (const [x, y] of perimeterPixels) {
      const directions = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
      ];
      
      for (const [dx, dy] of directions) {
        // Start further out to skip dark outlines
        for (let dist = 5; dist <= 40; dist += 2) {
          const sx = Math.round(x + dx * dist);
          const sy = Math.round(y + dy * dist);
          const skey = `${sx},${sy}`;
          
          if (!mask.has(skey) && sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) {
            const si = (sy * canvas.width + sx) * 4;
            const r = originalData[si];
            const g = originalData[si + 1];
            const b = originalData[si + 2];
            const a = originalData[si + 3];
            
            // Only bright, opaque pixels (avoid dark outlines/text)
            const brightness = (r + g + b) / 3;
            if (a > 200 && brightness > 100) {
              backgroundSamples.push([r, g, b]);
              break;
            }
          }
        }
      }
      
      if (backgroundSamples.length > 200) break;
    }

    // Use MEDIAN instead of average (robust against outliers)
    let avgR = 0, avgG = 0, avgB = 0;
    if (backgroundSamples.length > 0) {
      const reds = backgroundSamples.map(s => s[0]).sort((a, b) => a - b);
      const greens = backgroundSamples.map(s => s[1]).sort((a, b) => a - b);
      const blues = backgroundSamples.map(s => s[2]).sort((a, b) => a - b);
      
      const mid = Math.floor(backgroundSamples.length / 2);
      avgR = reds[mid];
      avgG = greens[mid];
      avgB = blues[mid];
    }

    console.log(`Removing ${mask.size} pixels`);
    console.log(`Perimeter pixels: ${perimeterPixels.length}`);
    console.log(`Background samples: ${backgroundSamples.length}`);
    console.log(`Median color: rgb(${avgR}, ${avgG}, ${avgB})`);

    // Fill with averaged background color
    mask.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const i = (y * canvas.width + x) * 4;
      
      if (backgroundSamples.length > 0) {
        data[i] = avgR;
        data[i + 1] = avgG;
        data[i + 2] = avgB;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    });

    ctx.putImageData(imageData, 0, 0);
    onComplete();
  };

  const clearMask = () => {
    setMaskPath([]);
  };

  return (
    <>
      <canvas
        ref={overlayRef}
        className="absolute inset-0 cursor-crosshair"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <div 
        className="absolute bg-gray-900 bg-opacity-90 backdrop-blur rounded-lg p-3 space-y-3 z-50 pointer-events-auto cursor-move"
        style={{
          left: `${panelPosition.x}px`,
          top: `${panelPosition.y}px`,
        }}
        onMouseDown={handlePanelMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <Eraser className="h-5 w-5" />
          <h3 className="text-sm">Object Remover (Drag to Move)</h3>
        </div>

        <div onMouseDown={(e) => e.stopPropagation()}>
          <label className="block text-xs text-gray-300 mb-2">
            Brush Size: {brushSize}px
          </label>
          <Slider
            value={[brushSize]}
            onValueChange={([value]) => setBrushSize(value)}
            min={10}
            max={100}
            step={5}
            className="w-48"
          />
        </div>

        <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <Button
            onClick={clearMask}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Clear
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          Paint over objects to remove them
        </p>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-50 pointer-events-auto">
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
          onClick={applyRemoval}
          disabled={maskPath.length === 0}
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Remove Object
        </Button>
      </div>
    </>
  );
}
