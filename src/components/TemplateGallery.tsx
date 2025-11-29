import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: any[];
}

const templates: Template[] = [
  {
    id: 'social-square',
    name: 'Social Media Post',
    category: 'Social Media',
    width: 1080,
    height: 1080,
    backgroundColor: '#667EEA',
    elements: []
  },
  {
    id: 'story',
    name: 'Instagram Story',
    category: 'Social Media',
    width: 1080,
    height: 1920,
    backgroundColor: '#F56565',
    elements: []
  },
  {
    id: 'post',
    name: 'Facebook Post',
    category: 'Social Media',
    width: 1200,
    height: 630,
    backgroundColor: '#48BB78',
    elements: []
  },
  {
    id: 'banner',
    name: 'Web Banner',
    category: 'Web',
    width: 1920,
    height: 1080,
    backgroundColor: '#ED8936',
    elements: []
  },
  {
    id: 'flyer',
    name: 'Flyer',
    category: 'Print',
    width: 1275,
    height: 1650,
    backgroundColor: '#9F7AEA',
    elements: []
  },
  {
    id: 'presentation',
    name: 'Presentation',
    category: 'Business',
    width: 1920,
    height: 1080,
    backgroundColor: '#38B2AC',
    elements: []
  },
  {
    id: 'logo-sticker',
    name: 'Logo / Sticker',
    category: 'Other',
    width: 2048,
    height: 2048,
    backgroundColor: 'transparent',
    elements: []
  }
];

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const categories = ['All', ...new Set(templates.map(t => t.category))];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              Choose a Template
            </h2>
            <p className="text-sm text-gray-400 mt-1">Start with a professional design</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 border-b border-gray-700 flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <div 
                  className="aspect-video w-full flex items-center justify-center"
                  style={{ backgroundColor: template.backgroundColor }}
                >
                  <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p>Click to use</p>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent p-3">
                  <p className="text-white text-sm">{template.name}</p>
                  <p className="text-gray-300 text-xs">{template.width} × {template.height}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Start from Blank Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
