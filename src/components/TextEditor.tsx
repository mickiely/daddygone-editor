import React from 'react';
import { TextBox } from './TextLayer';
import { FontSelector } from './FontSelector';
import { Slider } from './ui/slider';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, RotateCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

interface TextEditorProps {
  textBox: TextBox | null;
  onUpdate: (updates: Partial<TextBox>) => void;
}

export function TextEditor({ textBox, onUpdate }: TextEditorProps) {
  const [showFontSelector, setShowFontSelector] = React.useState(false);

  if (!textBox) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-sm">Select a text box to edit</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm text-gray-400 mb-4">Edit Text</h3>

      {/* Text Content */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Text</label>
        <textarea
          value={textBox.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
          rows={4}
          placeholder="Enter your text..."
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Font</label>
        <Popover open={showFontSelector} onOpenChange={setShowFontSelector}>
          <PopoverTrigger asChild>
            <button className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white text-left hover:bg-gray-600 transition-colors">
              <span style={{ fontFamily: textBox.fontFamily }}>
                {textBox.fontFamily.split(',')[0]}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-gray-800 border-gray-700">
            <FontSelector
              currentFont={textBox.fontFamily}
              onSelect={(font) => {
                onUpdate({ fontFamily: font });
                setShowFontSelector(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">
          Size: {textBox.fontSize}px
        </label>
        <Slider
          value={[textBox.fontSize]}
          onValueChange={([value]) => onUpdate({ fontSize: value })}
          min={8}
          max={200}
          step={1}
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={textBox.color || '#000000'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-12 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={textBox.color || '#000000'}
            onChange={(e) => {
              const value = e.target.value;
              // Only update if it's a valid hex color format
              if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                onUpdate({ color: value });
              }
            }}
            className="flex-1 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white uppercase font-mono text-sm"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
      </div>

      {/* Text Style */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Style</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ bold: !textBox.bold })}
            className={`p-2 rounded-md transition-colors ${
              textBox.bold ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdate({ italic: !textBox.italic })}
            className={`p-2 rounded-md transition-colors ${
              textBox.italic ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdate({ underline: !textBox.underline })}
            className={`p-2 rounded-md transition-colors ${
              textBox.underline ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Alignment</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ textAlign: 'left' })}
            className={`p-2 rounded-md transition-colors ${
              textBox.textAlign === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdate({ textAlign: 'center' })}
            className={`p-2 rounded-md transition-colors ${
              textBox.textAlign === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdate({ textAlign: 'right' })}
            className={`p-2 rounded-md transition-colors ${
              textBox.textAlign === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">
          Letter Spacing: {textBox.letterSpacing}px
        </label>
        <Slider
          value={[textBox.letterSpacing]}
          onValueChange={([value]) => onUpdate({ letterSpacing: value })}
          min={-5}
          max={20}
          step={0.5}
        />
      </div>

      {/* Line Height */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">
          Line Height: {textBox.lineHeight}
        </label>
        <Slider
          value={[textBox.lineHeight]}
          onValueChange={([value]) => onUpdate({ lineHeight: value })}
          min={0.5}
          max={3}
          step={0.1}
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
          <RotateCw className="h-4 w-4" />
          Rotation: {textBox.rotation}°
        </label>
        <Slider
          value={[textBox.rotation]}
          onValueChange={([value]) => onUpdate({ rotation: value })}
          min={0}
          max={360}
          step={1}
        />
      </div>
    </div>
  );
}
