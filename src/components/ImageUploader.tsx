import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
}

export function ImageUploader({ onImageUpload, isLoading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
        isDragging
          ? 'border-blue-500 bg-blue-500 bg-opacity-10'
          : 'border-gray-600 hover:border-gray-500'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
          {isDragging ? (
            <ImageIcon className="h-10 w-10 text-blue-400" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-white">
            {isDragging ? 'Drop your image here' : 'Upload an image to recolor'}
          </p>
          <p className="text-sm text-gray-400">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, WEBP
          </p>
        </div>
      </div>
    </div>
  );
}
