import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCcw, Undo, Redo, Sparkles, FileUp, AlertCircle, FlipHorizontal, FlipVertical, RotateCw, Maximize2, Wand2, Keyboard, Paintbrush, Eraser as EraserIcon, Droplet, Pipette, Sticker, Scan, Type, Crop, Trash2 } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ColorTools, Tool } from './components/ColorTools';
import { ColorAdjustments, Adjustments } from './components/ColorAdjustments';
import { FiltersPanel, FilterSettings } from './components/FiltersPanel';
import { TemplateGallery } from './components/TemplateGallery';
import { CanvasSizeDialog } from './components/CanvasSizeDialog';
import { ShapeTools } from './components/ShapeTools';
import { TextLayer, TextBox } from './components/TextLayer';
import { TextEditor } from './components/TextEditor';
import { CropTool } from './components/CropTool';
import { ObjectRemover } from './components/ObjectRemover';
import { BackgroundRemover } from './components/BackgroundRemover';
import { StickerLifter } from './components/StickerLifter';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { LayersPanel } from './components/LayersPanel';
import { LayerCanvas } from './components/LayerCanvas';
import { GeminiKeyDialog } from './components/GeminiKeyDialog';
import { Layer } from './components/LayerItem';
import { detectLayersWithAI, extractLayerFromBounds, createSmartMask } from './components/ai-layer-detection';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Separator } from './components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

interface HistoryState {
  imageData: ImageData;
}

export default function App() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('brush');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(20);
  const [opacity, setOpacity] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scale, setScale] = useState(1);
  
  // Text boxes
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [textIdCounter, setTextIdCounter] = useState(0);

  // Crop mode
  const [isCropping, setIsCropping] = useState(false);
  
  // Object removal mode
  const [isRemovingObject, setIsRemovingObject] = useState(false);
  
  // Background removal mode  
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  
  // Sticker lifter mode
  const [isLiftingSticker, setIsLiftingSticker] = useState(false);
  
  // Magic remove tolerance
  const [magicRemoveTolerance, setMagicRemoveTolerance] = useState(30);
  
  // New image confirmation
  const [showNewImageDialog, setShowNewImageDialog] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('tools');
  
  // Template & Canvas dialogs
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showCanvasSizeDialog, setShowCanvasSizeDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showGeminiKeyDialog, setShowGeminiKeyDialog] = useState(false);
  
  // Layers system
  const [imageLayers, setImageLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  const [layerIdCounter, setLayerIdCounter] = useState(0);
  const [isDetectingLayers, setIsDetectingLayers] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  
  // Filters
  const [filters, setFilters] = useState<FilterSettings>({
    blur: 0,
    sharpen: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    pixelate: 0,
  });
  
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    temperature: 0,
    tint: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale for display
  useEffect(() => {
    if (originalImage && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const maxWidth = container.width - 100;
      const maxHeight = container.height - 100;
      
      const scaleX = maxWidth / originalImage.width;
      const scaleY = maxHeight / originalImage.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
    }
  }, [originalImage]);

  // Initialize canvas when image is loaded
  useEffect(() => {
    if (originalImage && canvasRef.current && drawingLayerRef.current) {
      const canvas = canvasRef.current;
      const drawingLayer = drawingLayerRef.current;
      const ctx = canvas.getContext('2d');
      const drawCtx = drawingLayer.getContext('2d');

      if (ctx && drawCtx) {
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        drawingLayer.width = originalImage.width;
        drawingLayer.height = originalImage.height;

        ctx.drawImage(originalImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([{ imageData }]);
        setHistoryIndex(0);
      }
    }
  }, [originalImage]);

  // Apply adjustments in real-time
  useEffect(() => {
    if (!canvasRef.current || !originalImage || historyIndex < 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = history[historyIndex];
    if (!currentState) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(currentState.imageData, 0, 0);

    const filterList = [];
    if (adjustments.brightness !== 0) {
      filterList.push(`brightness(${100 + adjustments.brightness}%)`);
    }
    if (adjustments.contrast !== 0) {
      filterList.push(`contrast(${100 + adjustments.contrast}%)`);
    }
    if (adjustments.saturation !== 0) {
      filterList.push(`saturate(${100 + adjustments.saturation}%)`);
    }
    if (adjustments.hue !== 0) {
      filterList.push(`hue-rotate(${adjustments.hue}deg)`);
    }
    
    // Add custom filters
    if (filters.blur > 0) {
      filterList.push(`blur(${filters.blur}px)`);
    }
    if (filters.grayscale > 0) {
      filterList.push(`grayscale(${filters.grayscale}%)`);
    }
    if (filters.sepia > 0) {
      filterList.push(`sepia(${filters.sepia}%)`);
    }
    if (filters.invert > 0) {
      filterList.push(`invert(${filters.invert}%)`);
    }

    ctx.filter = filterList.join(' ') || 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
    
    // Apply sharpen if needed (sharpen is not a CSS filter, requires manual implementation)
    if (filters.sharpen > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applySharpen(imageData, filters.sharpen / 100);
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Apply pixelate if needed
    if (filters.pixelate > 0) {
      applyPixelate(ctx, canvas.width, canvas.height, filters.pixelate);
    }
  }, [adjustments, filters, history, historyIndex, originalImage]);

  // Handle tool change
  useEffect(() => {
    if (selectedTool === 'crop') {
      setIsCropping(true);
      setIsRemovingObject(false);
      setIsRemovingBackground(false);
    } else if (selectedTool === 'remove') {
      setIsRemovingObject(true);
      setIsCropping(false);
      setIsRemovingBackground(false);
    } else if (selectedTool === 'bgremove') {
      setIsRemovingBackground(true);
      setIsCropping(false);
      setIsRemovingObject(false);
      setIsLiftingSticker(false);
    } else if (selectedTool === 'sticker') {
      setIsLiftingSticker(true);
      setIsCropping(false);
      setIsRemovingObject(false);
      setIsRemovingBackground(false);
    } else {
      setIsCropping(false);
      setIsRemovingObject(false);
      setIsRemovingBackground(false);
      setIsLiftingSticker(false);
    }
    
    // Auto-switch to text tab when text tool is selected and a text box is selected
    if (selectedTool === 'text' && selectedTextBoxId) {
      setActiveTab('text');
    }
  }, [selectedTool, selectedTextBoxId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl/Cmd + Y for redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl/Cmd + S for download
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (originalImage) handleDownload();
      }
      // B for brush
      if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
        setSelectedTool('brush');
      }
      // E for eraser
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        setSelectedTool('eraser');
      }
      // T for text
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        setSelectedTool('text');
      }
      // C for crop
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        setSelectedTool('crop');
      }
      // I for eyedropper
      if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
        setSelectedTool('eyedropper');
      }
      // ? for keyboard shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowKeyboardShortcuts(true);
      }
      // Escape to close dialogs
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [originalImage, historyIndex, history]);

  // Handle image upload
  const handleImageUpload = (file: File) => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setTextBoxes([]);
      setSelectedTextBoxId(null);
      toast.success('Image loaded successfully!');
    };
    img.src = URL.createObjectURL(file);
  };

  // Save to history
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ imageData });
    
    if (newHistory.length > 50) {
      newHistory.shift();
      setHistoryIndex(49);
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.putImageData(history[historyIndex - 1].imageData, 0, 0);
      }
      toast.success('Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.putImageData(history[historyIndex + 1].imageData, 0, 0);
      }
      toast.success('Redo');
    }
  };

  // Get canvas coordinates
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingLayerRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };
  
  // Filter helper functions
  const applySharpen = (imageData: ImageData, amount: number) => {
    const data = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * w + (x + kx)) * 4 + c;
              sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * w + x) * 4 + c;
          data[idx] = tempData[idx] * (1 - amount) + sum * amount;
        }
      }
    }
  };
  
  const applyPixelate = (ctx: CanvasRenderingContext2D, width: number, height: number, size: number) => {
    const pixelSize = Math.max(1, size);
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        const imageData = ctx.getImageData(x, y, 1, 1);
        ctx.fillStyle = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  };

  // Text box functions
  const handleAddTextBox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'text') return;

    const { x, y } = getCanvasCoordinates(e);
    const newId = `text-${textIdCounter}`;
    setTextIdCounter(textIdCounter + 1);

    const newTextBox: TextBox = {
      id: newId,
      x,
      y,
      text: 'Double click to edit',
      fontSize: 32,
      color: selectedColor,
      fontFamily: 'Inter, sans-serif',
      textAlign: 'left',
      bold: false,
      italic: false,
      underline: false,
      letterSpacing: 0,
      lineHeight: 1.2,
      rotation: 0,
    };

    setTextBoxes([...textBoxes, newTextBox]);
    setSelectedTextBoxId(newId);
    setActiveTab('text');
    toast.success('Text box added');
  };

  const handleUpdateTextBox = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(textBoxes.map(tb => tb.id === id ? { ...tb, ...updates } : tb));
  };

  const handleDeleteTextBox = (id: string) => {
    setTextBoxes(textBoxes.filter(tb => tb.id !== id));
    if (selectedTextBoxId === id) {
      setSelectedTextBoxId(null);
    }
    toast.success('Text box deleted');
  };

  const selectedTextBox = textBoxes.find(tb => tb.id === selectedTextBoxId) || null;

  // Crop functions
  const handleCrop = (cropArea: { x: number; y: number; width: number; height: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the cropped area
    const croppedImageData = ctx.getImageData(
      Math.round(cropArea.x),
      Math.round(cropArea.y),
      Math.round(cropArea.width),
      Math.round(cropArea.height)
    );

    // Resize canvas to cropped size
    canvas.width = Math.round(cropArea.width);
    canvas.height = Math.round(cropArea.height);

    // Put cropped image data
    ctx.putImageData(croppedImageData, 0, 0);

    // Update drawing layer size
    const drawingLayer = drawingLayerRef.current;
    if (drawingLayer) {
      drawingLayer.width = canvas.width;
      drawingLayer.height = canvas.height;
    }

    // Adjust text box positions
    setTextBoxes(textBoxes.map(tb => ({
      ...tb,
      x: tb.x - cropArea.x,
      y: tb.y - cropArea.y,
    })).filter(tb => tb.x >= 0 && tb.y >= 0 && tb.x < cropArea.width && tb.y < cropArea.height));

    // Create new image from cropped canvas
    const newImg = new Image();
    newImg.onload = () => {
      setOriginalImage(newImg);
      saveToHistory();
    };
    newImg.src = canvas.toDataURL();

    setIsCropping(false);
    setSelectedTool('brush');
    toast.success('Image cropped');
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'text') {
      handleAddTextBox(e);
      return;
    }

    if (isCropping) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    if (selectedTool === 'fill') {
      floodFill(x, y);
      return;
    }

    if (selectedTool === 'magicremove') {
      magicRemove(x, y);
      return;
    }
    
    if (selectedTool === 'eyedropper') {
      pickColor(x, y);
      return;
    }

    draw(x, y);
  };

  const draw = (x: number, y: number) => {
    const drawingLayer = drawingLayerRef.current;
    const drawCtx = drawingLayer?.getContext('2d');
    if (!drawCtx) return;

    drawCtx.globalAlpha = opacity;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    if (selectedTool === 'brush') {
      drawCtx.globalCompositeOperation = 'source-over';
      drawCtx.strokeStyle = selectedColor;
      drawCtx.lineWidth = brushSize;
      drawCtx.lineTo(x, y);
      drawCtx.stroke();
      drawCtx.beginPath();
      drawCtx.moveTo(x, y);
    } else if (selectedTool === 'eraser') {
      drawCtx.globalCompositeOperation = 'destination-out';
      drawCtx.lineWidth = brushSize;
      drawCtx.lineTo(x, y);
      drawCtx.stroke();
      drawCtx.beginPath();
      drawCtx.moveTo(x, y);
    } else if (selectedTool === 'colorize') {
      // Colorize by modifying pixels in a circular area
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const halfBrush = Math.floor(brushSize / 2);
      
      // Get color components
      const targetR = parseInt(selectedColor.slice(1, 3), 16);
      const targetG = parseInt(selectedColor.slice(3, 5), 16);
      const targetB = parseInt(selectedColor.slice(5, 7), 16);
      
      // Process pixels in a circle around the cursor
      for (let dy = -halfBrush; dy <= halfBrush; dy++) {
        for (let dx = -halfBrush; dx <= halfBrush; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= halfBrush) {
            const px = Math.floor(x + dx);
            const py = Math.floor(y + dy);
            
            if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
              const imageData = ctx.getImageData(px, py, 1, 1);
              const data = imageData.data;
              
              // Only colorize non-transparent pixels
              if (data[3] > 0) {
                // Soft brush falloff
                const falloff = 1 - (distance / halfBrush);
                const effectiveOpacity = opacity * falloff;
                
                // Blend the color
                data[0] = Math.round(data[0] * (1 - effectiveOpacity) + targetR * effectiveOpacity);
                data[1] = Math.round(data[1] * (1 - effectiveOpacity) + targetG * effectiveOpacity);
                data[2] = Math.round(data[2] * (1 - effectiveOpacity) + targetB * effectiveOpacity);
                
                ctx.putImageData(imageData, px, py);
              }
            }
          }
        }
      }
    }
  };

  const continueDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    draw(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const drawingLayer = drawingLayerRef.current;
    const drawCtx = drawingLayer?.getContext('2d');
    if (drawCtx) {
      drawCtx.beginPath();
    }

    // For colorize tool, save history directly since it modifies main canvas
    if (selectedTool === 'colorize') {
      saveToHistory();
    } else {
      mergeDrawingLayer();
    }
  };

  const mergeDrawingLayer = () => {
    const canvas = canvasRef.current;
    const drawingLayer = drawingLayerRef.current;
    const ctx = canvas?.getContext('2d');
    const drawCtx = drawingLayer?.getContext('2d');

    if (!canvas || !drawingLayer || !ctx || !drawCtx) return;

    ctx.drawImage(drawingLayer, 0, 0);
    drawCtx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
    saveToHistory();
  };

  // Flood fill algorithm (paint bucket tool)
  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    console.log('=== FILL TOOL CLICKED ===');
    console.log('Click coords:', Math.floor(startX), Math.floor(startY));
    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    // Validate coordinates
    if (startX < 0 || startX >= canvas.width || startY < 0 || startY >= canvas.height) {
      toast.error('Click is outside canvas bounds');
      console.log('OUT OF BOUNDS!');
      return;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const targetColor = getPixelColor(data, startX, startY, canvas.width);
    const fillColor = hexToRgb(selectedColor);

    console.log('Target color at pixel:', targetColor, `(${targetColor[3] === 0 ? 'transparent' : 'opaque'})`);
    console.log('Fill with color:', fillColor);

    // Check if clicking on transparent pixel
    if (targetColor[3] === 0) {
      toast.error('Cannot fill transparent pixel');
      console.log('Target is transparent!');
      return;
    }

    // Don't fill if target is already the fill color
    if (colorsMatch(targetColor, fillColor, 5)) {
      toast.error('Target is already this color');
      console.log('Already filled with this color');
      return;
    }

    const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set<string>();
    let pixelsFilled = 0;

    // Use tolerance of 40 for gradient/anti-aliased areas
    const fillTolerance = 40;
    console.log('Starting fill with tolerance:', fillTolerance);

    while (stack.length > 0) {
      const point = stack.pop();
      if (!point) break;
      
      const [x, y] = point;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

      const currentColor = getPixelColor(data, x, y, canvas.width);
      
      // Must match target color within tolerance
      if (!colorsMatch(currentColor, targetColor, fillTolerance)) continue;

      setPixelColor(data, x, y, canvas.width, fillColor);
      pixelsFilled++;

      // Add all 4 neighbors
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    console.log(`Filled ${pixelsFilled} pixels`);

    if (pixelsFilled === 0) {
      toast.error('No pixels matched - try clicking a different area');
      return;
    }

    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
    toast.success(`Filled ${pixelsFilled.toLocaleString()} pixels`);
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [data[i] || 0, data[i + 1] || 0, data[i + 2] || 0, data[i + 3] || 0];
  };

  const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number, color: number[]) => {
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    // Fill tool should always be 100% opaque, use color[3] if provided
    data[i + 3] = color[3] !== undefined ? color[3] : 255;
  };

  const hexToRgb = (hex: string): number[] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  };

  const colorsMatch = (a: number[], b: number[], tolerance = 30) => {
    return Math.abs(a[0] - b[0]) < tolerance &&
           Math.abs(a[1] - b[1]) < tolerance &&
           Math.abs(a[2] - b[2]) < tolerance;
  };

  // Magic remove - intelligent background color sampling
  const magicRemove = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const originalData = new Uint8ClampedArray(data);

    const targetColor = getPixelColor(originalData, startX, startY, canvas.width);
    if (targetColor[3] === 0) {
      toast.error('Clicked on transparent pixel');
      return;
    }

    console.log('Magic Erase target color:', targetColor);
    console.log('Magic Erase tolerance:', magicRemoveTolerance);

    const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set<string>();
    const toRemove = new Set<string>();

    // Find all matching pixels with flood fill - no limit!
    while (stack.length > 0) {
      const point = stack.pop();
      if (!point) break;
      
      const [x, y] = point;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

      const currentColor = getPixelColor(originalData, x, y, canvas.width);
      if (currentColor[3] === 0) continue;
      if (!colorsMatch(currentColor, targetColor, magicRemoveTolerance)) continue;

      toRemove.add(key);
      
      // Add neighbors to stack
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
    
    if (toRemove.size === 0) {
      toast.error('No pixels found - try increasing tolerance');
      return;
    }

    // Convert toRemove set to coordinate array
    const coords = Array.from(toRemove).map(k => k.split(',').map(Number));

    // Smart background sampling - only from perimeter, avoid dark colors
    const backgroundSamples: number[][] = [];
    
    // Find perimeter pixels only (pixels that border the removal area)
    const perimeterPixels: [number, number][] = [];
    for (const [x, y] of coords) {
      // Check if this pixel is on the edge (has a neighbor not in toRemove)
      const neighbors = [
        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
      ];
      const isPerimeter = neighbors.some(([nx, ny]) => {
        const nkey = `${nx},${ny}`;
        return !toRemove.has(nkey) && nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height;
      });
      
      if (isPerimeter) {
        perimeterPixels.push([x, y]);
      }
    }

    // Sample outward from perimeter pixels only
    for (const [x, y] of perimeterPixels) {
      const directions = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
      ];
      
      for (const [dx, dy] of directions) {
        // Start further out to avoid dark outlines
        for (let dist = 5; dist <= 40; dist += 2) {
          const sx = Math.round(x + dx * dist);
          const sy = Math.round(y + dy * dist);
          const skey = `${sx},${sy}`;
          
          if (!toRemove.has(skey) && sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) {
            const si = (sy * canvas.width + sx) * 4;
            const r = originalData[si];
            const g = originalData[si + 1];
            const b = originalData[si + 2];
            const a = originalData[si + 3];
            
            // Only use bright, opaque pixels (avoid dark outlines)
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

    // Use MEDIAN color instead of average (more robust against outliers)
    let avgR = 0, avgG = 0, avgB = 0;
    if (backgroundSamples.length > 0) {
      // Sort each channel and take median
      const reds = backgroundSamples.map(s => s[0]).sort((a, b) => a - b);
      const greens = backgroundSamples.map(s => s[1]).sort((a, b) => a - b);
      const blues = backgroundSamples.map(s => s[2]).sort((a, b) => a - b);
      
      const mid = Math.floor(backgroundSamples.length / 2);
      avgR = reds[mid];
      avgG = greens[mid];
      avgB = blues[mid];
    }

    console.log(`Removing ${toRemove.size} pixels`);
    console.log(`Perimeter pixels: ${perimeterPixels.length}`);
    console.log(`Background samples: ${backgroundSamples.length}`);
    console.log(`Median color: rgb(${avgR}, ${avgG}, ${avgB})`);

    // Fill all pixels with averaged background color
    toRemove.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const i = (y * canvas.width + x) * 4;
      
      if (backgroundSamples.length > 0) {
        data[i] = avgR;
        data[i + 1] = avgG;
        data[i + 2] = avgB;
        data[i + 3] = 255;
      } else {
        // Fallback: transparent
        data[i + 3] = 0;
      }
    });

    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
    toast.success(`Removed ${toRemove.size} pixels!`);
  };

  // Apply adjustments permanently
  const handleApplyAdjustments = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (adjustments.brightness !== 0) {
        const bright = adjustments.brightness * 2.55;
        r = Math.max(0, Math.min(255, r + bright));
        g = Math.max(0, Math.min(255, g + bright));
        b = Math.max(0, Math.min(255, b + bright));
      }

      if (adjustments.contrast !== 0) {
        const factor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
        r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
      }

      if (adjustments.temperature !== 0) {
        r = Math.max(0, Math.min(255, r + adjustments.temperature * 0.5));
        b = Math.max(0, Math.min(255, b - adjustments.temperature * 0.5));
      }

      if (adjustments.tint !== 0) {
        g = Math.max(0, Math.min(255, g + adjustments.tint * 0.5));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
    saveToHistory();

    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
    });

    toast.success('Adjustments applied');
  };

  // Eyedropper - pick color from canvas
  const pickColor = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const [r, g, b] = imageData.data;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    setSelectedColor(hex.toUpperCase());
    setSelectedTool('brush');
    toast.success(`Color picked: ${hex.toUpperCase()}`);
  };
  
  // Flip horizontal
  const handleFlipHorizontal = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, -canvas.width, 0);
    ctx.restore();
    
    saveToHistory();
    toast.success('Flipped horizontally');
  };
  
  // Flip vertical
  const handleFlipVertical = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(tempCanvas, 0, -canvas.height);
    ctx.restore();
    
    saveToHistory();
    toast.success('Flipped vertically');
  };
  
  // Rotate 90 degrees clockwise
  const handleRotate90 = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.putImageData(imageData, 0, 0);
    
    // Swap dimensions
    const newWidth = canvas.height;
    const newHeight = canvas.width;
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Update drawing layer
    const drawingLayer = drawingLayerRef.current;
    if (drawingLayer) {
      drawingLayer.width = newWidth;
      drawingLayer.height = newHeight;
    }
    
    ctx.save();
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
    ctx.restore();
    
    saveToHistory();
    toast.success('Rotated 90°');
  };
  
  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    createBlankCanvas(template.width, template.height, template.backgroundColor);
    setShowTemplateGallery(false);
    toast.success(`Template "${template.name}" loaded`);
  };
  
  // Handle canvas creation
  const handleCanvasCreate = (width: number, height: number, color: string) => {
    createBlankCanvas(width, height, color);
    setShowCanvasSizeDialog(false);
  };
  
  // Create blank canvas
  const createBlankCanvas = (width: number, height: number, backgroundColor: string) => {
    const canvas = canvasRef.current;
    const drawingLayer = drawingLayerRef.current;
    if (!canvas || !drawingLayer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    canvas.width = width;
    canvas.height = height;
    drawingLayer.width = width;
    drawingLayer.height = height;

    // Fill with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Create a fake image element for the blank canvas
    const img = new Image();
    img.width = width;
    img.height = height;
    setOriginalImage(img);

    // Save to history
    const imageData = ctx.getImageData(0, 0, width, height);
    setHistory([{ imageData }]);
    setHistoryIndex(0);

    toast.success('Canvas created');
  };
  
  // Apply filter presets
  const handleApplyFilterPreset = (preset: string) => {
    switch (preset) {
      case 'none':
        setFilters({ blur: 0, sharpen: 0, grayscale: 0, sepia: 0, invert: 0, pixelate: 0 });
        break;
      case 'bw':
        setFilters({ ...filters, grayscale: 100, sepia: 0 });
        break;
      case 'sepia':
        setFilters({ ...filters, sepia: 100, grayscale: 0 });
        break;
      case 'vintage':
        setFilters({ ...filters, sepia: 60, grayscale: 20 });
        break;
      case 'cool':
        setAdjustments({ ...adjustments, temperature: -20, tint: 10 });
        break;
      case 'warm':
        setAdjustments({ ...adjustments, temperature: 20, tint: -10 });
        break;
      case 'dramatic':
        setAdjustments({ ...adjustments, contrast: 30, saturation: -20 });
        break;
      case 'vibrant':
        setAdjustments({ ...adjustments, saturation: 40, contrast: 10 });
        break;
    }
    toast.success('Filter applied');
  };

  // Download final image with text
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to composite everything
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    // Draw the main canvas
    finalCtx.drawImage(canvas, 0, 0);

    // Draw text boxes
    textBoxes.forEach(textBox => {
      finalCtx.save();
      finalCtx.translate(textBox.x, textBox.y);
      finalCtx.rotate((textBox.rotation * Math.PI) / 180);
      
      finalCtx.font = `${textBox.italic ? 'italic ' : ''}${textBox.bold ? 'bold ' : ''}${textBox.fontSize}px ${textBox.fontFamily}`;
      finalCtx.fillStyle = textBox.color;
      finalCtx.textAlign = textBox.textAlign;
      finalCtx.letterSpacing = `${textBox.letterSpacing}px`;
      
      const lines = textBox.text.split('\n');
      lines.forEach((line, index) => {
        const y = index * textBox.fontSize * textBox.lineHeight;
        finalCtx.fillText(line, 0, y);
        
        if (textBox.underline) {
          const metrics = finalCtx.measureText(line);
          finalCtx.beginPath();
          finalCtx.moveTo(0, y + 2);
          finalCtx.lineTo(metrics.width, y + 2);
          finalCtx.strokeStyle = textBox.color;
          finalCtx.lineWidth = 1;
          finalCtx.stroke();
        }
      });
      
      finalCtx.restore();
    });

    finalCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edited-image-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Image downloaded!');
      }
    }, 'image/png');
  };

  // Reset
  const handleReset = () => {
    if (originalImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0);
        saveToHistory();
        setAdjustments({
          brightness: 0,
          contrast: 0,
          saturation: 0,
          hue: 0,
          temperature: 0,
          tint: 0,
        });
        setTextBoxes([]);
        setSelectedTextBoxId(null);
        toast.success('Image reset');
      }
    }
  };

  // New image - clear everything
  const handleNewImage = () => {
    setShowNewImageDialog(true);
  };

  const confirmNewImage = () => {
    setOriginalImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setTextBoxes([]);
    setSelectedTextBoxId(null);
    setImageLayers([]);
    setSelectedLayerId(null);
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
    });
    setSelectedTool('brush');
    setShowNewImageDialog(false);
    toast.success('Ready for new image');
  };
  
  // Layer Management Functions
  const handleDetectLayers = async () => {
    if (!canvasRef.current) return;
    const sourceCanvas = canvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return;
    
    // Check if API key is set
    if (!geminiApiKey) {
      setShowGeminiKeyDialog(true);
      return;
    }
    
    setIsDetectingLayers(true);
    toast.info('Detecting layers with AI...');
    
    try {
      const detectedObjects = await detectLayersWithAI(canvasRef.current, geminiApiKey);
      
      if (detectedObjects.length === 0) {
        toast.error('No objects detected. Try adjusting the image or use manual tools.');
        return;
      }
      
      // Create layers from detected objects
      const newLayers: Layer[] = detectedObjects.map((obj, index) => {
        const bounds = obj.bounds;
        let mask: ImageData | null = null;
        try {
          mask = createSmartMask(sourceCanvas, bounds, 35);
        } catch (err) {
          console.warn('Mask generation failed, falling back to simple crop', err);
        }

        let layerCanvas: HTMLCanvasElement;
        if (mask) {
          const region = sourceCtx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
          const masked = sourceCtx.createImageData(bounds.width, bounds.height);
          for (let i = 0; i < region.data.length; i += 4) {
            const alpha = mask.data[i + 3] / 255;
            masked.data[i] = region.data[i];
            masked.data[i + 1] = region.data[i + 1];
            masked.data[i + 2] = region.data[i + 2];
            masked.data[i + 3] = Math.round(region.data[i + 3] * alpha);
          }
          layerCanvas = document.createElement('canvas');
          layerCanvas.width = bounds.width;
          layerCanvas.height = bounds.height;
          const lctx = layerCanvas.getContext('2d');
          lctx?.putImageData(masked, 0, 0);
        } else {
          layerCanvas = extractLayerFromBounds(sourceCanvas, bounds);
        }
        
        return {
          id: layerIdCounter + index + 1,
          type: 'image' as const,
          name: obj.name || `Object ${index + 1}`,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          opacity: 1,
          isVisible: true,
          zIndex: imageLayers.length + index + 1,
          src: layerCanvas.toDataURL(),
          rotation: 0,
          isAIObject: true,
        };
      });
      
      setImageLayers([...imageLayers, ...newLayers]);
      setLayerIdCounter(layerIdCounter + detectedObjects.length);
      toast.success(`Detected ${detectedObjects.length} layer${detectedObjects.length !== 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Layer detection error:', error);
      toast.error('Failed to detect layers. Check your API key and try again.');
    } finally {
      setIsDetectingLayers(false);
    }
  };
  
  const handleAddImageLayer = () => {
    // Add current canvas as a layer
    if (!canvasRef.current) return;
    
    const newLayer: Layer = {
      id: layerIdCounter + 1,
      type: 'image',
      name: `Layer ${layerIdCounter + 1}`,
      x: 0,
      y: 0,
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      opacity: 1,
      isVisible: true,
      zIndex: imageLayers.length + 1,
      src: canvasRef.current.toDataURL(),
      rotation: 0,
    };
    
    setImageLayers([...imageLayers, newLayer]);
    setLayerIdCounter(layerIdCounter + 1);
    toast.success('Layer added');
  };
  
  const handleLayerUpdate = (id: number, updates: Partial<Layer>) => {
    setImageLayers(imageLayers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };
  
  const handleToggleLayerVisibility = (id: number) => {
    setImageLayers(imageLayers.map(layer =>
      layer.id === id ? { ...layer, isVisible: !layer.isVisible } : layer
    ));
  };
  
  const handleDeleteLayer = (id: number) => {
    setImageLayers(imageLayers.filter(layer => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
    toast.success('Layer deleted');
  };
  
  const handleDuplicateLayer = (id: number) => {
    const layer = imageLayers.find(l => l.id === id);
    if (!layer) return;
    
    const newLayer: Layer = {
      ...layer,
      id: layerIdCounter + 1,
      name: `${layer.name} Copy`,
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: imageLayers.length + 1,
    };
    
    setImageLayers([...imageLayers, newLayer]);
    setLayerIdCounter(layerIdCounter + 1);
    toast.success('Layer duplicated');
  };
  
  const handleReorderLayer = (id: number, direction: 'up' | 'down') => {
    const index = imageLayers.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const newLayers = [...imageLayers];
    if (direction === 'up' && index > 0) {
      [newLayers[index].zIndex, newLayers[index - 1].zIndex] = [newLayers[index - 1].zIndex, newLayers[index].zIndex];
    } else if (direction === 'down' && index < newLayers.length - 1) {
      [newLayers[index].zIndex, newLayers[index + 1].zIndex] = [newLayers[index + 1].zIndex, newLayers[index].zIndex];
    }
    
    setImageLayers(newLayers);
  };
  
  const handleSaveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowGeminiKeyDialog(false);
    toast.success('API key saved!');
    
    // Automatically trigger layer detection
    setTimeout(() => {
      handleDetectLayers();
    }, 500);
  };

  const toolSidebarItems = [
    { value: 'brush' as Tool, label: 'Brush', icon: Paintbrush },
    { value: 'eraser' as Tool, label: 'Eraser', icon: EraserIcon },
    { value: 'fill' as Tool, label: 'Fill', icon: Droplet },
    { value: 'eyedropper' as Tool, label: 'Eyedropper', icon: Pipette },
    { value: 'colorize' as Tool, label: 'Colorize', icon: Wand2 },
    { value: 'sticker' as Tool, label: 'Lift Sticker', icon: Sticker },
    { value: 'magicremove' as Tool, label: 'Magic Erase', icon: Scan },
    { value: 'text' as Tool, label: 'Text', icon: Type },
    { value: 'crop' as Tool, label: 'Crop', icon: Crop },
    { value: 'remove' as Tool, label: 'Remove', icon: Trash2 },
    { value: 'bgremove' as Tool, label: 'Bg Remove', icon: Sparkles },
  ];

  const sidebarSwatches = [
    '#0EA5E9', '#22C55E', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899',
    '#14B8A6', '#3B82F6', '#6366F1', '#0F172A', '#1F2937', '#F8FAFC',
  ];

  const hasImage = Boolean(originalImage);

  return (
    <div className="flex min-h-screen w-screen flex-col bg-gray-950 text-white">
      <Toaster position="top-right" />

      <header className="border-b border-gray-800 bg-gray-900/90 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Color Editor Pro</h1>
              <p className="text-xs text-gray-400">AI Layers · Filters · Stickers · Templates · Full Editing Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://daddygone.smartartse.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-white"
              >
                Daddy Gone
              </a>
            </Button>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-200">
              Preview
            </Button>
            <Button onClick={handleDownload} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowKeyboardShortcuts(true)}
              variant="ghost"
              size="sm"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            {!originalImage && (
              <>
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                <Button onClick={() => setShowTemplateGallery(true)} variant="outline" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Templates
                </Button>
                <Button onClick={() => setShowCanvasSizeDialog(true)} variant="outline" size="sm">
                  <Maximize2 className="mr-2 h-4 w-4" />
                  New Canvas
                </Button>
              </>
            )}
          </div>

          {originalImage && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleNewImage}
                variant="outline"
                size="sm"
              >
                <FileUp className="mr-2 h-4 w-4" />
                New
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/70 px-6 py-2">
          <TabsList className="h-10 bg-gray-800/80">
            <TabsTrigger value="tools" className="data-[state=active]:bg-gray-700">Tools</TabsTrigger>
            <TabsTrigger value="layers" className="data-[state=active]:bg-gray-700">Layers</TabsTrigger>
            <TabsTrigger value="adjust" className="data-[state=active]:bg-gray-700">Adjust</TabsTrigger>
            <TabsTrigger value="filters" className="data-[state=active]:bg-gray-700">Filters</TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-gray-700">Text</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              variant="ghost"
              size="sm"
            >
              <Undo className="mr-2 h-4 w-4" />
              Undo
            </Button>
            <Button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              variant="ghost"
              size="sm"
            >
              <Redo className="mr-2 h-4 w-4" />
              Redo
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={handleFlipHorizontal} variant="ghost" size="sm" title="Flip Horizontal">
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button onClick={handleFlipVertical} variant="ghost" size="sm" title="Flip Vertical">
              <FlipVertical className="h-4 w-4" />
            </Button>
            <Button onClick={handleRotate90} variant="ghost" size="sm" title="Rotate 90°">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1">
          <aside className="flex w-72 flex-col border-r border-gray-800 bg-gray-900/80 backdrop-blur">
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Tools</p>
              <div className="flex flex-col gap-2">
                {toolSidebarItems.map((tool) => (
                  <button
                    key={tool.value}
                    onClick={() => setSelectedTool(tool.value)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      selectedTool === tool.value
                        ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                        : 'border-gray-800 bg-gray-900/80 text-gray-200 hover:border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <tool.icon className="h-4 w-4" />
                      <span>{tool.label}</span>
                    </div>
                    {selectedTool === tool.value && <span className="text-[10px] uppercase tracking-wide text-white/80">Active</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto border-t border-gray-800 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Swatches</p>
              <div className="grid grid-cols-6 gap-2">
                {sidebarSwatches.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-8 w-full rounded-md transition hover:scale-105 ${
                      selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </aside>

          <div className="flex flex-1">
            <div
              ref={containerRef}
              className="flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-gray-950 p-8"
            >
              {!hasImage ? (
                <div className="flex w-full max-w-3xl items-center justify-center">
                  <div className="w-full max-w-2xl rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-6 shadow-2xl">
                    <ImageUploader onImageUpload={handleImageUpload} isLoading={false} />
                  </div>
                </div>
              ) : (
                <div className="relative inline-block">
                  <div className="relative shadow-2xl">
                    {/* Main canvas */}
                    <canvas
                      ref={canvasRef}
                      className="block rounded-lg"
                      style={{
                        width: `${canvasRef.current?.width ? canvasRef.current.width * scale : 0}px`,
                        height: `${canvasRef.current?.height ? canvasRef.current.height * scale : 0}px`,
                        imageRendering: 'auto',
                      }}
                    />

                    {/* Drawing layer */}
                    <canvas
                      ref={drawingLayerRef}
                      className={`absolute inset-0 ${isRemovingObject || isCropping ? 'pointer-events-none' : 'pointer-events-auto'}`}
                      onMouseDown={startDrawing}
                      onMouseMove={continueDrawing}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      style={{
                        width: `${drawingLayerRef.current?.width ? drawingLayerRef.current.width * scale : 0}px`,
                        height: `${drawingLayerRef.current?.height ? drawingLayerRef.current.height * scale : 0}px`,
                        cursor: selectedTool === 'fill' ? 'crosshair' : selectedTool === 'eraser' ? 'cell' : selectedTool === 'text' ? 'text' : selectedTool === 'magicremove' ? 'pointer' : 'crosshair',
                      }}
                    />

                    {/* Text layer */}
                    {canvasRef.current && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          width: `${canvasRef.current.width * scale}px`,
                          height: `${canvasRef.current.height * scale}px`,
                          transform: `scale(${scale})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <TextLayer
                          textBoxes={textBoxes}
                          selectedTextBoxId={selectedTextBoxId}
                          onSelectTextBox={(id) => {
                            setSelectedTextBoxId(id);
                            setActiveTab('text');
                          }}
                          onUpdateTextBox={handleUpdateTextBox}
                          onDeleteTextBox={handleDeleteTextBox}
                          canvasWidth={canvasRef.current.width}
                          canvasHeight={canvasRef.current.height}
                          scale={scale}
                        />
                      </div>
                    )}

                    {/* Layer Canvas Overlay */}
                    {canvasRef.current && imageLayers.length > 0 && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          width: `${canvasRef.current.width * scale}px`,
                          height: `${canvasRef.current.height * scale}px`,
                        }}
                      >
                        <LayerCanvas
                          layers={imageLayers}
                          selectedLayerId={selectedLayerId}
                          scale={scale}
                          onLayerUpdate={handleLayerUpdate}
                          onLayerSelect={(id) => {
                            setSelectedLayerId(id);
                            if (id !== null) setActiveTab('layers');
                          }}
                          canvasWidth={canvasRef.current.width}
                          canvasHeight={canvasRef.current.height}
                        />
                      </div>
                    )}

                    {/* Crop tool overlay */}
                    {isCropping && canvasRef.current && (
                      <div
                        className="absolute inset-0"
                        style={{
                          width: `${canvasRef.current.width * scale}px`,
                          height: `${canvasRef.current.height * scale}px`,
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                            width: `${canvasRef.current.width}px`,
                            height: `${canvasRef.current.height}px`,
                          }}
                        >
                          <CropTool
                            canvasWidth={canvasRef.current.width}
                            canvasHeight={canvasRef.current.height}
                            onCrop={handleCrop}
                            onCancel={() => {
                              setIsCropping(false);
                              setSelectedTool('brush');
                            }}
                            scale={scale}
                          />
                        </div>
                      </div>
                    )}

                    {/* Object remover overlay */}
                    {isRemovingObject && canvasRef.current && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          width: `${canvasRef.current.width * scale}px`,
                          height: `${canvasRef.current.height * scale}px`,
                        }}
                      >
                        <ObjectRemover
                          canvas={canvasRef.current}
                          scale={1}
                          onComplete={() => {
                            setIsRemovingObject(false);
                            setSelectedTool('brush');
                            saveToHistory();
                            toast.success('Object removed');
                          }}
                          onCancel={() => {
                            setIsRemovingObject(false);
                            setSelectedTool('brush');
                          }}
                        />
                      </div>
                    )}

                    {/* Sticker Lifter overlay */}
                    {isLiftingSticker && canvasRef.current && (
                      <StickerLifter
                        canvas={canvasRef.current}
                        scale={scale}
                        onComplete={(stickerCanvas, bounds) => {
                          const newLayer: Layer = {
                            id: layerIdCounter + 1,
                            type: 'image',
                            name: `Sticker ${layerIdCounter + 1}`,
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            opacity: 1,
                            isVisible: true,
                            zIndex: imageLayers.length + 1,
                            src: stickerCanvas.toDataURL(),
                            rotation: 0,
                          };

                          setImageLayers([...imageLayers, newLayer]);
                          setLayerIdCounter(layerIdCounter + 1);
                          setSelectedLayerId(newLayer.id);
                          toast.success('Sticker applied as new layer!');
                          setIsLiftingSticker(false);
                          setSelectedTool('brush');
                        }}
                        onCancel={() => {
                          setIsLiftingSticker(false);
                          setSelectedTool('brush');
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {hasImage ? (
              <aside className="w-96 border-l border-gray-800 bg-gray-900/80 backdrop-blur overflow-y-auto">
                <div className="space-y-4 p-4">
                  <TabsContent value="tools" className="mt-0">
                    <ColorTools
                      selectedTool={selectedTool}
                      onToolChange={setSelectedTool}
                      brushSize={brushSize}
                      onBrushSizeChange={setBrushSize}
                      opacity={opacity}
                      onOpacityChange={setOpacity}
                      selectedColor={selectedColor}
                      onColorChange={setSelectedColor}
                      tolerance={magicRemoveTolerance}
                      onToleranceChange={setMagicRemoveTolerance}
                      hideToolGrid
                    />
                  </TabsContent>

                  <TabsContent value="layers" className="mt-0 h-full">
                    <LayersPanel
                      layers={imageLayers}
                      selectedLayerId={selectedLayerId}
                      onSelectLayer={setSelectedLayerId}
                      onToggleVisibility={handleToggleLayerVisibility}
                      onDeleteLayer={handleDeleteLayer}
                      onDuplicateLayer={handleDuplicateLayer}
                      onReorderLayer={handleReorderLayer}
                      onDetectLayers={handleDetectLayers}
                      onAddImageLayer={handleAddImageLayer}
                      isDetecting={isDetectingLayers}
                    />
                  </TabsContent>

                  <TabsContent value="adjust" className="mt-0">
                    <ColorAdjustments
                      adjustments={adjustments}
                      onAdjustmentChange={(key, value) =>
                        setAdjustments((prev) => ({ ...prev, [key]: value }))
                      }
                      onReset={() =>
                        setAdjustments({
                          brightness: 0,
                          contrast: 0,
                          saturation: 0,
                          hue: 0,
                          temperature: 0,
                          tint: 0,
                        })
                      }
                      onApply={handleApplyAdjustments}
                    />
                  </TabsContent>

                  <TabsContent value="filters" className="mt-0">
                    <FiltersPanel
                      filters={filters}
                      onFilterChange={setFilters}
                      onApplyPreset={handleApplyFilterPreset}
                    />
                  </TabsContent>

                  <TabsContent value="text" className="mt-0">
                    <TextEditor
                      textBox={selectedTextBox}
                      onUpdate={(updates) => {
                        if (selectedTextBoxId) {
                          handleUpdateTextBox(selectedTextBoxId, updates);
                        }
                      }}
                    />
                  </TabsContent>

                  {isRemovingBackground && canvasRef.current && (
                    <div className="border-t border-gray-800 pt-4">
                      <BackgroundRemover
                        canvas={canvasRef.current}
                        onComplete={() => {
                          setIsRemovingBackground(false);
                          setSelectedTool('brush');
                          saveToHistory();
                        }}
                      />
                    </div>
                  )}
                </div>
              </aside>
            ) : (
              <aside className="w-96 border-l border-gray-900/70 bg-gray-900/60 backdrop-blur-sm">
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center text-gray-400">
                  <div className="rounded-full bg-gray-800/70 p-3">
                    <Sparkles className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-200">Panels available after you upload.</p>
                  <p className="text-xs text-gray-400">Drop an image to unlock layers, adjustments, filters, and text controls.</p>
                </div>
              </aside>
            )}
          </div>
        </div>
      </Tabs>

      {/* New Image Confirmation Dialog */}
      <AlertDialog open={showNewImageDialog} onOpenChange={setShowNewImageDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Start New Image?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will clear your current work and all edits. This action cannot be undone.
              Make sure you've downloaded your image if you want to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmNewImage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Yes, Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Template Gallery */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
      
      {/* Canvas Size Dialog */}
      {showCanvasSizeDialog && (
        <CanvasSizeDialog
          onConfirm={handleCanvasCreate}
          onCancel={() => setShowCanvasSizeDialog(false)}
        />
      )}
      
      {/* Keyboard Shortcuts */}
      {showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
      )}
      
      {/* Gemini API Key Dialog */}
      {showGeminiKeyDialog && (
        <GeminiKeyDialog
          onSave={handleSaveGeminiKey}
          onCancel={() => setShowGeminiKeyDialog(false)}
          currentKey={geminiApiKey}
        />
      )}
    </div>
  );
}
