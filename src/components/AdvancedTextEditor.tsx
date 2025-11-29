import React from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  LetterText, Minus, Plus, Palette
} from 'lucide-react';
import { Layer } from './LayerItem';
import { FontSelector } from './FontSelector';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';

interface AdvancedTextEditorProps {
  layer: Layer;
  onUpdate: (props: Partial<Layer>) => void;
}

export function AdvancedTextEditor({ layer, onUpdate }: AdvancedTextEditorProps) {
  const [showFontSelector, setShowFontSelector] = React.useState(false);

  const toggleStyle = (style: 'bold' | 'italic' | 'underline') => {
    const currentStyles = layer.textStyles || {};
    onUpdate({
      textStyles: {
        ...currentStyles,
        [style]: !currentStyles[style]
      }
    });
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    onUpdate({ textAlign: align });
  };

  return (
    <div className="space-y-4">
      {/* Text Content */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Text Content</label>
        <textarea
          value={layer.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
          rows={3}
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Font Family</label>
        <Popover open={showFontSelector} onOpenChange={setShowFontSelector}>
          <PopoverTrigger asChild>
            <button className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 text-white text-left hover:bg-gray-600 transition-colors">
              <span style={{ fontFamily: layer.fontFamily || 'Inter, sans-serif' }}>
                {layer.fontFamily?.split(',')[0] || 'Inter'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-gray-800 border-gray-700">
            <FontSelector
              currentFont={layer.fontFamily || 'Inter, sans-serif'}
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
        <label className="block text-sm text-gray-300 mb-1">
          Font Size: {layer.fontSize || 24}px
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ fontSize: Math.max(8, (layer.fontSize || 24) - 2) })}
            className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <Slider
            value={[layer.fontSize || 24]}
            onValueChange={([value]) => onUpdate({ fontSize: value })}
            min={8}
            max={200}
            step={1}
            className="flex-1"
          />
          <button
            onClick={() => onUpdate({ fontSize: Math.min(200, (layer.fontSize || 24) + 2) })}
            className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Text Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={layer.color || '#FFFFFF'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-12 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={layer.color || '#FFFFFF'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="flex-1 p-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white uppercase"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {/* Text Styles */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Text Style</label>
        <div className="flex gap-2">
          <button
            onClick={() => toggleStyle('bold')}
            className={`p-2 rounded-md transition-colors ${
              layer.textStyles?.bold
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleStyle('italic')}
            className={`p-2 rounded-md transition-colors ${
              layer.textStyles?.italic
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleStyle('underline')}
            className={`p-2 rounded-md transition-colors ${
              layer.textStyles?.underline
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Text Alignment</label>
        <div className="flex gap-2">
          <button
            onClick={() => setAlignment('left')}
            className={`p-2 rounded-md transition-colors ${
              layer.textAlign === 'left'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAlignment('center')}
            className={`p-2 rounded-md transition-colors ${
              layer.textAlign === 'center'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAlignment('right')}
            className={`p-2 rounded-md transition-colors ${
              layer.textAlign === 'right'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">
          Letter Spacing: {layer.letterSpacing || 0}px
        </label>
        <Slider
          value={[layer.letterSpacing || 0]}
          onValueChange={([value]) => onUpdate({ letterSpacing: value })}
          min={-5}
          max={20}
          step={0.5}
        />
      </div>

      {/* Line Height */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">
          Line Height: {layer.lineHeight || 1.2}
        </label>
        <Slider
          value={[layer.lineHeight || 1.2]}
          onValueChange={([value]) => onUpdate({ lineHeight: value })}
          min={0.5}
          max={3}
          step={0.1}
        />
      </div>

      {/* Text Shadow */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">
          Text Shadow
        </label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={layer.textShadow || false}
            onChange={(e) => onUpdate({ textShadow: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-400">Enable shadow</span>
        </div>
      </div>
    </div>
  );
}
