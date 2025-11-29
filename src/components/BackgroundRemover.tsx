import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { toast } from 'sonner';

interface BackgroundRemoverProps {
  canvas: HTMLCanvasElement;
  onComplete: () => void;
}

export function BackgroundRemover({ canvas, onComplete }: BackgroundRemoverProps) {
  const [threshold, setThreshold] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  const removeBackground = () => {
    setIsProcessing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (mode === 'auto') {
        // Sample edges to determine background color
        const edgeColors: number[][] = [];
        
        // Top edge
        for (let x = 0; x < canvas.width; x += 10) {
          edgeColors.push(getPixelColor(data, x, 0, canvas.width));
        }
        // Bottom edge
        for (let x = 0; x < canvas.width; x += 10) {
          edgeColors.push(getPixelColor(data, x, canvas.height - 1, canvas.width));
        }
        // Left edge
        for (let y = 0; y < canvas.height; y += 10) {
          edgeColors.push(getPixelColor(data, 0, y, canvas.width));
        }
        // Right edge
        for (let y = 0; y < canvas.height; y += 10) {
          edgeColors.push(getPixelColor(data, canvas.width - 1, y, canvas.width));
        }

        // Find most common edge color (background)
        const backgroundColor = findMostCommonColor(edgeColors);

        // Remove pixels similar to background
        for (let i = 0; i < data.length; i += 4) {
          const pixelColor = [data[i], data[i + 1], data[i + 2]];
          if (colorsMatch(pixelColor, backgroundColor, threshold)) {
            data[i + 3] = 0; // Make transparent
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      toast.success('Background removed!');
      onComplete();
    } catch (error) {
      console.error('Background removal error:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number): number[] => {
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const findMostCommonColor = (colors: number[][]): number[] => {
    const colorMap = new Map<string, { color: number[]; count: number }>();

    colors.forEach(color => {
      const key = color.join(',');
      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { color, count: 1 });
      }
    });

    let maxCount = 0;
    let mostCommon = [255, 255, 255];

    colorMap.forEach(({ color, count }) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = color;
      }
    });

    return mostCommon;
  };

  const colorsMatch = (a: number[], b: number[], tolerance: number): boolean => {
    return Math.abs(a[0] - b[0]) < tolerance &&
           Math.abs(a[1] - b[1]) < tolerance &&
           Math.abs(a[2] - b[2]) < tolerance;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-gray-300 mb-4">
        <Wand2 className="h-5 w-5" />
        <h3>Background Remover</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Sensitivity: {threshold}
          </label>
          <Slider
            value={[threshold]}
            onValueChange={([value]) => setThreshold(value)}
            min={5}
            max={100}
            step={5}
          />
          <p className="text-xs text-gray-400 mt-2">
            Lower = more precise, Higher = more aggressive
          </p>
        </div>

        <div className="p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
          <p className="text-xs text-blue-200">
            💡 This tool detects the background color from the edges and removes similar colors throughout the image.
          </p>
        </div>

        <Button
          onClick={removeBackground}
          disabled={isProcessing}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Remove Background
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
