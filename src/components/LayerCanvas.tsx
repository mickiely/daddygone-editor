import React, { useRef, useEffect, useState } from 'react';
import { Layer } from './LayerItem';

interface LayerCanvasProps {
  layers: Layer[];
  selectedLayerId: number | null;
  scale: number;
  onLayerUpdate: (id: number, updates: Partial<Layer>) => void;
  onLayerSelect: (id: number | null) => void;
  canvasWidth: number;
  canvasHeight: number;
}

interface TransformHandle {
  x: number;
  y: number;
  cursor: string;
  type: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate';
}

export function LayerCanvas({
  layers,
  selectedLayerId,
  scale,
  onLayerUpdate,
  onLayerSelect,
  canvasWidth,
  canvasHeight,
}: LayerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  useEffect(() => {
    drawLayers();
  }, [layers, selectedLayerId]);

  const drawLayers = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all visible layers in z-index order
    const sortedLayers = [...layers]
      .filter((l) => l.isVisible)
      .sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach((layer) => {
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'image' && layer.src) {
        const img = new Image();
        img.src = layer.src;
        ctx.translate(layer.x + layer.width / 2, layer.y + (layer.height || layer.width) / 2);
        ctx.rotate((layer.rotation || 0) * Math.PI / 180);
        ctx.drawImage(img, -layer.width / 2, -(layer.height || layer.width) / 2, layer.width, layer.height || layer.width);
      } else if (layer.type === 'shape') {
        ctx.translate(layer.x + layer.width / 2, layer.y + (layer.height || layer.width) / 2);
        ctx.rotate((layer.rotation || 0) * Math.PI / 180);
        
        ctx.fillStyle = layer.fillColor || '#3B82F6';
        if (layer.strokeColor) {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth || 2;
        }

        switch (layer.shapeType) {
          case 'rectangle':
            ctx.fillRect(-layer.width / 2, -(layer.height || layer.width) / 2, layer.width, layer.height || layer.width);
            if (layer.strokeColor) ctx.strokeRect(-layer.width / 2, -(layer.height || layer.width) / 2, layer.width, layer.height || layer.width);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, layer.width / 2, 0, Math.PI * 2);
            ctx.fill();
            if (layer.strokeColor) ctx.stroke();
            break;
        }
      }

      ctx.restore();

      // Draw selection outline
      if (layer.id === selectedLayerId) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height || layer.width);
        ctx.setLineDash([]);

        // Draw resize handles
        drawResizeHandles(ctx, layer, scale);
      }
    });
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, layer: Layer, scale: number) => {
    const handleSize = 8 / scale;
    const handles = getResizeHandles(layer, handleSize);

    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1 / scale;

    handles.forEach((handle) => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  };

  const getResizeHandles = (layer: Layer, handleSize: number): TransformHandle[] => {
    const h = layer.height || layer.width;
    return [
      { x: layer.x, y: layer.y, cursor: 'nw-resize', type: 'nw' },
      { x: layer.x + layer.width, y: layer.y, cursor: 'ne-resize', type: 'ne' },
      { x: layer.x, y: layer.y + h, cursor: 'sw-resize', type: 'sw' },
      { x: layer.x + layer.width, y: layer.y + h, cursor: 'se-resize', type: 'se' },
      { x: layer.x + layer.width / 2, y: layer.y, cursor: 'n-resize', type: 'n' },
      { x: layer.x + layer.width / 2, y: layer.y + h, cursor: 's-resize', type: 's' },
      { x: layer.x, y: layer.y + h / 2, cursor: 'w-resize', type: 'w' },
      { x: layer.x + layer.width, y: layer.y + h / 2, cursor: 'e-resize', type: 'e' },
    ];
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (!selectedLayer) {
      // Try to select a layer
      const clickedLayer = [...layers]
        .sort((a, b) => b.zIndex - a.zIndex)
        .find((layer) => {
          const h = layer.height || layer.width;
          return (
            layer.isVisible &&
            x >= layer.x &&
            x <= layer.x + layer.width &&
            y >= layer.y &&
            y <= layer.y + h
          );
        });

      if (clickedLayer) {
        onLayerSelect(clickedLayer.id);
      } else {
        onLayerSelect(null);
      }
      return;
    }

    // Check if clicking on a resize handle
    const handleSize = 8 / scale;
    const handles = getResizeHandles(selectedLayer, handleSize);
    const clickedHandle = handles.find((handle) => {
      return (
        Math.abs(x - handle.x) <= handleSize &&
        Math.abs(y - handle.y) <= handleSize
      );
    });

    if (clickedHandle) {
      setIsResizing(true);
      setResizeHandle(clickedHandle.type);
      setDragStart({ x, y });
      return;
    }

    // Check if clicking on layer body (for dragging)
    const h = selectedLayer.height || selectedLayer.width;
    if (
      x >= selectedLayer.x &&
      x <= selectedLayer.x + selectedLayer.width &&
      y >= selectedLayer.y &&
      y <= selectedLayer.y + h
    ) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLayer) return;

    const { x, y } = getCanvasCoordinates(e);

    if (isDragging) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      onLayerUpdate(selectedLayer.id, {
        x: selectedLayer.x + dx,
        y: selectedLayer.y + dy,
      });

      setDragStart({ x, y });
    } else if (isResizing && resizeHandle) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      let updates: Partial<Layer> = {};

      switch (resizeHandle) {
        case 'se':
          updates = {
            width: Math.max(20, selectedLayer.width + dx),
            height: Math.max(20, (selectedLayer.height || selectedLayer.width) + dy),
          };
          break;
        case 'sw':
          updates = {
            x: selectedLayer.x + dx,
            width: Math.max(20, selectedLayer.width - dx),
            height: Math.max(20, (selectedLayer.height || selectedLayer.width) + dy),
          };
          break;
        case 'ne':
          updates = {
            y: selectedLayer.y + dy,
            width: Math.max(20, selectedLayer.width + dx),
            height: Math.max(20, (selectedLayer.height || selectedLayer.width) - dy),
          };
          break;
        case 'nw':
          updates = {
            x: selectedLayer.x + dx,
            y: selectedLayer.y + dy,
            width: Math.max(20, selectedLayer.width - dx),
            height: Math.max(20, (selectedLayer.height || selectedLayer.width) - dy),
          };
          break;
        case 'e':
          updates = { width: Math.max(20, selectedLayer.width + dx) };
          break;
        case 'w':
          updates = {
            x: selectedLayer.x + dx,
            width: Math.max(20, selectedLayer.width - dx),
          };
          break;
        case 's':
          updates = { height: Math.max(20, (selectedLayer.height || selectedLayer.width) + dy) };
          break;
        case 'n':
          updates = {
            y: selectedLayer.y + dy,
            height: Math.max(20, (selectedLayer.height || selectedLayer.width) - dy),
          };
          break;
      }

      onLayerUpdate(selectedLayer.id, updates);
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute top-0 left-0 pointer-events-auto"
      style={{
        width: `${canvasWidth * scale}px`,
        height: `${canvasHeight * scale}px`,
        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
