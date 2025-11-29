import React, { useState } from 'react';
import { X, Key, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface GeminiKeyDialogProps {
  onSave: (apiKey: string) => void;
  onCancel: () => void;
  currentKey?: string;
}

export function GeminiKeyDialog({ onSave, onCancel, currentKey = '' }: GeminiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(currentKey);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl">AI Layer Detection</h2>
              <p className="text-xs text-gray-400">Powered by Google Gemini</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-gray-300 text-sm mb-4">
              To use AI-powered layer detection, you need a <strong>Google Gemini API key</strong>.
              This feature uses AI to intelligently identify and separate objects in your image.
            </p>
            
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg mb-4">
              <p className="text-blue-300 text-sm">
                ✨ <strong>Free tier available!</strong> Google provides generous free usage of Gemini API.
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">
              <strong>How to get your API key:</strong>
            </p>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Click "Get API Key" in the top right</li>
              <li>Copy your API key and paste it above</li>
            </ol>
            
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Get API Key from Google AI Studio
            </a>
          </div>

          {/* Privacy Note */}
          <div className="text-xs text-gray-500 p-3 bg-gray-900 rounded">
            <strong>Privacy:</strong> Your API key is stored locally in your browser and never sent to our servers.
            Images are processed by Google's Gemini API according to their privacy policy.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (apiKey.trim()) {
                onSave(apiKey.trim());
              } else {
                alert('Please enter a valid API key');
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
