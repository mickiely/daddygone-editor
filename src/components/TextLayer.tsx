import React, { useRef, useEffect, useState } from 'react';
import { X, Move } from 'lucide-react';

export interface TextBox {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  letterSpacing: number;
  lineHeight: number;
  rotation: number;
}

interface TextLayerProps {
  textBoxes: TextBox[];
  selectedTextBoxId: string | null;
  onSelectTextBox: (id: string) => void;
  onUpdateTextBox: (id: string, updates: Partial<TextBox>) => void;
  onDeleteTextBox: (id: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
}

export function TextLayer({
  textBoxes,
  selectedTextBoxId,
  onSelectTextBox,
  onUpdateTextBox,
  onDeleteTextBox,
  canvasWidth,
  canvasHeight,
  scale,
}: TextLayerProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, textBox: TextBox) => {
    e.stopPropagation();
    onSelectTextBox(textBox.id);
    setDraggingId(textBox.id);
    setDragStart({ x: e.clientX - textBox.x * scale, y: e.clientY - textBox.y * scale });
  };

  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragStart.x) / scale;
      const newY = (e.clientY - dragStart.y) / scale;
      onUpdateTextBox(draggingId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragStart, scale, onUpdateTextBox]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: canvasWidth, height: canvasHeight }}>
      {textBoxes.map((textBox) => {
        const isSelected = textBox.id === selectedTextBoxId;
        const textStyles: React.CSSProperties = {
          fontSize: `${textBox.fontSize}px`,
          color: textBox.color,
          fontFamily: textBox.fontFamily,
          textAlign: textBox.textAlign,
          fontWeight: textBox.bold ? 'bold' : 'normal',
          fontStyle: textBox.italic ? 'italic' : 'normal',
          textDecoration: textBox.underline ? 'underline' : 'none',
          letterSpacing: `${textBox.letterSpacing}px`,
          lineHeight: textBox.lineHeight,
          transform: `rotate(${textBox.rotation}deg)`,
          whiteSpace: 'pre-wrap',
        };

        return (
          <div
            key={textBox.id}
            className={`absolute pointer-events-auto cursor-move ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${textBox.x}px`,
              top: `${textBox.y}px`,
              ...textStyles,
            }}
            onMouseDown={(e) => handleMouseDown(e, textBox)}
          >
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTextBox(textBox.id);
                }}
                className="absolute -top-8 right-0 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
            {isSelected && (
              <div className="absolute -top-8 left-0 p-1 bg-blue-600 rounded text-xs text-white px-2">
                <Move className="h-3 w-3 inline mr-1" />
                Drag to move
              </div>
            )}
            {textBox.text || 'Double click to edit'}
          </div>
        );
      })}
    </div>
  );
}
