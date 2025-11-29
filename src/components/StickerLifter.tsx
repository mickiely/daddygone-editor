import React, { useState, useRef, useEffect } from 'react';
import { Download, X, Check, Scissors, Eraser, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface StickerLifterProps {
  canvas: HTMLCanvasElement;
  scale: number;
  onComplete: (stickerCanvas: HTMLCanvasElement) => void;
  onCancel: () => void;
}

type Mode = 'select' | 'refine';

export function StickerLifter({ canvas, scale, onComplete, onCancel }: StickerLifterProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<Mode>('select');
  const [tolerance, setTolerance] = useState(30);
  const [selectedRegion, setSelectedRegion] = useState<Set<string>>(new Set());
  const [brushSize, setBrushSize] = useState(20);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);

  // Drag handlers for panel
  const handlePanelDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    window.addEventListener('mousemove', handlePanelDrag);
    window.addEventListener('mouseup', handlePanelDragEnd);
  };

  const handlePanelDrag = (e: MouseEvent) => {
    if (!dragState.current || !panelRef.current) return;
    const width = panelRef.current.offsetWidth;
    const height = panelRef.current.offsetHeight;
    const margin = 8;
    const nextX = e.clientX - dragState.current.offsetX;
    const nextY = e.clientY - dragState.current.offsetY;

    const clampedX = Math.min(Math.max(nextX, margin), window.innerWidth - width - margin);
    const clampedY = Math.min(Math.max(nextY, margin), window.innerHeight - height - margin);
    setPanelPosition({ x: clampedX, y: clampedY });
  };

  const handlePanelDragEnd = () => {
    window.removeEventListener('mousemove', handlePanelDrag);
    window.removeEventListener('mouseup', handlePanelDragEnd);
    dragState.current = null;
  };

  // Initialize overlay canvas
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // Clear overlay
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }, [canvas]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handlePanelDrag);
      window.removeEventListener('mouseup', handlePanelDragEnd);
    };
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  };

  const floodFillSelect = (startX: number, startY: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const visited = new Set<string>();
    const toFill = new Set<string>();
    
    const startIdx = (startY * canvas.width + startX) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];

    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

      visited.add(key);

      const idx = (y * canvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB);

      if (diff <= tolerance) {
        toFill.add(key);
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }
    }

    setSelectedRegion(toFill);
    drawSelection(toFill);
  };

  const drawSelection = (region: Set<string>) => {
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 150, 255, 0.4)';

    region.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      ctx.fillRect(x, y, 1, 1);
    });
  };

  const refineBrush = (x: number, y: number, add: boolean) => {
    const newRegion = new Set(selectedRegion);
    
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
            const key = `${px},${py}`;
            if (add) {
              newRegion.add(key);
            } else {
              newRegion.delete(key);
            }
          }
        }
      }
    }

    setSelectedRegion(newRegion);
    drawSelection(newRegion);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    if (mode === 'select') {
      floodFillSelect(x, y);
    } else {
      refineBrush(x, y, e.button === 0); // Left click adds, right click removes
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === 'select') return;
    const { x, y } = getCanvasCoordinates(e);
    refineBrush(x, y, e.buttons === 1);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const panelStyle = panelPosition
    ? { left: panelPosition.x, top: panelPosition.y, transform: 'none' as const }
    : undefined;

  const createSticker = () => {
    const stickerCanvas = document.createElement('canvas');
    stickerCanvas.width = canvas.width;
    stickerCanvas.height = canvas.height;
    const stickerCtx = stickerCanvas.getContext('2d');
    if (!stickerCtx) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newImageData = stickerCtx.createImageData(canvas.width, canvas.height);

    // Copy selected pixels with transparency
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const key = `${x},${y}`;
        const idx = (y * canvas.width + x) * 4;

        if (selectedRegion.has(key)) {
          newImageData.data[idx] = imageData.data[idx];
          newImageData.data[idx + 1] = imageData.data[idx + 1];
          newImageData.data[idx + 2] = imageData.data[idx + 2];
          newImageData.data[idx + 3] = imageData.data[idx + 3];
        } else {
          newImageData.data[idx + 3] = 0; // Transparent
        }
      }
    }

    stickerCtx.putImageData(newImageData, 0, 0);
    onComplete(stickerCanvas);
  };

  const downloadSticker = () => {
    const stickerCanvas = document.createElement('canvas');
    stickerCanvas.width = canvas.width;
    stickerCanvas.height = canvas.height;
    const stickerCtx = stickerCanvas.getContext('2d');
    if (!stickerCtx) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newImageData = stickerCtx.createImageData(canvas.width, canvas.height);

    // Copy selected pixels with transparency
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const key = `${x},${y}`;
        const idx = (y * canvas.width + x) * 4;

        if (selectedRegion.has(key)) {
          newImageData.data[idx] = imageData.data[idx];
          newImageData.data[idx + 1] = imageData.data[idx + 1];
          newImageData.data[idx + 2] = imageData.data[idx + 2];
          newImageData.data[idx + 3] = imageData.data[idx + 3];
        } else {
          newImageData.data[idx + 3] = 0; // Transparent
        }
      }
    }

    stickerCtx.putImageData(newImageData, 0, 0);

    // Download
    stickerCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sticker-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Overlay canvas for selection visualization */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 cursor-crosshair"
        style={{
          width: `${canvas.width * scale}px`,
          height: `${canvas.height * scale}px`,
          pointerEvents: 'all',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Controls Panel */}
      <div
        ref={panelRef}
        className={`fixed bg-gray-900 rounded-lg shadow-2xl p-4 border border-gray-700 ${
          panelPosition ? '' : 'left-1/2 -translate-x-1/2 bottom-4'
        }`}
        style={panelStyle}
      >
        <div className="flex flex-col gap-4 min-w-[400px]">
          <div
            className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-800/70 px-3 py-1 text-xs text-gray-300 cursor-move"
            onMouseDown={handlePanelDragStart}
          >
            <span>Lift Sticker</span>
            <span className="text-[10px] text-gray-400">Drag to move</span>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              onClick={() => setMode('select')}
              variant={mode === 'select' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Select Area
            </Button>
            <Button
              onClick={() => setMode('refine')}
              variant={mode === 'refine' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Refine Edges
            </Button>
          </div>

          {/* Tolerance/Brush Size */}
          {mode === 'select' ? (
            <div>
              <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
                <span>Tolerance</span>
                <span className="text-white">{tolerance}</span>
              </label>
              <Slider
                value={[tolerance]}
                onValueChange={([value]) => setTolerance(value)}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">Click on the object to select similar colors</p>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
                <span>Brush Size</span>
                <span className="text-white">{brushSize}px</span>
              </label>
              <Slider
                value={[brushSize]}
                onValueChange={([value]) => setBrushSize(value)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">Left click to add, right click to remove</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSelectedRegion(new Set());
                const ctx = overlayCanvasRef.current?.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={downloadSticker}
              disabled={selectedRegion.size === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sticker
            </Button>
            <Button
              onClick={createSticker}
              disabled={selectedRegion.size === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply to Canvas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
