import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, X, Check, Scissors, Eraser, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import {
  BoundingBox,
  createSelectionMaskFromSeed,
  extractStickerCanvas,
  featherMask,
  getMaskBoundingBox,
  growShrinkMask,
} from './utils/selection-mask';

interface StickerLifterProps {
  canvas: HTMLCanvasElement;
  scale: number;
  onComplete: (stickerCanvas: HTMLCanvasElement, bounds: BoundingBox) => void;
  onCancel: () => void;
}

type Mode = 'select' | 'refine';

export function StickerLifter({ canvas, scale, onComplete, onCancel }: StickerLifterProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('select');
  const [tolerance, setTolerance] = useState(30);
  const [brushSize, setBrushSize] = useState(20);
  const [feather, setFeather] = useState(2);
  const [expand, setExpand] = useState(0);
  const [baseMask, setBaseMask] = useState<Uint8ClampedArray | null>(null);
  const [displayMask, setDisplayMask] = useState<Uint8ClampedArray | null>(null);
  const [stickerCanvas, setStickerCanvas] = useState<HTMLCanvasElement | null>(null);
  const [bounds, setBounds] = useState<BoundingBox | null>(null);
  const [lastSeed, setLastSeed] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize overlay canvas
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    drawMaskOverlay(displayMask);
  }, [canvas, displayMask, drawMaskOverlay]);

  useEffect(() => {
    if (stickerCanvas) {
      setPreviewUrl(stickerCanvas.toDataURL());
    } else {
      setPreviewUrl(null);
    }
  }, [stickerCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * scaleY))),
    };
  };

  const drawMaskOverlay = useCallback((mask: Uint8ClampedArray | null) => {
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas?.getContext('2d');
    if (!ctx || !overlayCanvas) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (!mask) return;

    const overlayData = ctx.createImageData(overlayCanvas.width, overlayCanvas.height);
    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i] > 0 ? 120 : 0;
      overlayData.data[i * 4] = 64;
      overlayData.data[i * 4 + 1] = 180;
      overlayData.data[i * 4 + 2] = 255;
      overlayData.data[i * 4 + 3] = alpha;
    }
    ctx.putImageData(overlayData, 0, 0);
  }, []);

  const rebuildPreview = useCallback((mask: Uint8ClampedArray | null, customExpand?: number, customFeather?: number) => {
    if (!mask) {
      setDisplayMask(null);
      setStickerCanvas(null);
      setBounds(null);
      drawMaskOverlay(null);
      return;
    }

    const expandAmount = customExpand !== undefined ? customExpand : expand;
    const featherAmount = customFeather !== undefined ? customFeather : feather;

    const grown = growShrinkMask(mask, canvas.width, canvas.height, expandAmount);
    const feathered = featherMask(grown, canvas.width, canvas.height, featherAmount);
    const bbox = getMaskBoundingBox(feathered, canvas.width, canvas.height);

    if (!bbox) {
      setDisplayMask(null);
      setStickerCanvas(null);
      setBounds(null);
      drawMaskOverlay(null);
      return;
    }

    const extracted = extractStickerCanvas(canvas, feathered, bbox);
    setDisplayMask(feathered);
    setStickerCanvas(extracted);
    setBounds(bbox);
    drawMaskOverlay(feathered);
  }, [canvas, drawMaskOverlay, expand, feather]);

  const handleSeedSelect = useCallback((x: number, y: number, nextTolerance?: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const tol = nextTolerance !== undefined ? nextTolerance : tolerance;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { mask } = createSelectionMaskFromSeed(imageData, x, y, tol);
    setLastSeed({ x, y });
    setBaseMask(mask);
    rebuildPreview(mask);
  }, [canvas, tolerance, rebuildPreview]);

  useEffect(() => {
    if (lastSeed) {
      handleSeedSelect(lastSeed.x, lastSeed.y, tolerance);
    }
  }, [tolerance, lastSeed, handleSeedSelect]);

  const refineBrush = (x: number, y: number, add: boolean) => {
    if (!baseMask) return;
    const updated = new Uint8ClampedArray(baseMask);
    const rSq = brushSize * brushSize;

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= rSq) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
            const idx = py * canvas.width + px;
            updated[idx] = add ? 255 : 0;
          }
        }
      }
    }

    setBaseMask(updated);
    rebuildPreview(updated);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    if (mode === 'select') {
      handleSeedSelect(x, y);
    } else {
      refineBrush(x, y, e.button === 0);
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

  const createSticker = () => {
    if (!stickerCanvas || !bounds) return;
    onComplete(stickerCanvas, bounds);
  };

  const downloadSticker = () => {
    if (!stickerCanvas) return;
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
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-lg shadow-2xl p-4 border border-gray-700">
        <div className="flex flex-col gap-4 min-w-[400px]">
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

          {/* Controls */}
          {mode === 'select' ? (
            <div className="space-y-2">
              <label className="text-sm text-gray-300 mb-1 flex items-center justify-between">
                <span>Tolerance</span>
                <span className="text-white">{tolerance}</span>
              </label>
              <Slider
                value={[tolerance]}
                onValueChange={([value]) => setTolerance(value)}
                min={5}
                max={120}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                Click on the object to select similar colors.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                <p className="text-xs text-gray-400 mt-1">Left click to add, right click to remove.</p>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
                  <span>Feather</span>
                  <span className="text-white">{feather}px</span>
                </label>
                <Slider
                  value={[feather]}
                  onValueChange={([value]) => {
                    setFeather(value);
                    rebuildPreview(baseMask, undefined, value);
                  }}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 flex items-center justify-between">
                  <span>Expand / Shrink</span>
                  <span className="text-white">{expand}</span>
                </label>
                <Slider
                  value={[expand]}
                  onValueChange={([value]) => {
                    setExpand(value);
                    rebuildPreview(baseMask, value, undefined);
                  }}
                  min={-5}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">Negative shrinks, positive grows the selection.</p>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-900 border border-gray-700 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Sticker preview" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-300">
              <p className="font-semibold text-white">Sticker Preview</p>
              <p className="text-xs text-gray-400">
                {stickerCanvas ? 'Ready to download or apply.' : 'Click the subject to lift it from the background.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setBaseMask(null);
                setDisplayMask(null);
                setStickerCanvas(null);
                setBounds(null);
                setLastSeed(null);
                drawMaskOverlay(null);
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
              disabled={!stickerCanvas}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sticker
            </Button>
            <Button
              onClick={createSticker}
              disabled={!stickerCanvas || !bounds}
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
