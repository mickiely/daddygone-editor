// --- API Configuration ---
const API_URL_IMAGE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";

// This is a placeholder key.
// In a real environment, this would be handled securely.
// Replace with your actual API key
export const API_KEY = "YOUR_API_KEY_HERE";

// --- Types ---
export interface GeminiApiOptions {
  base64ImageData: string;
  mimeType: string;
  prompt: string;
}

// --- Helper Functions ---

/**
 * Converts an image file to a Base64 string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the dimensions of an image from its Base64 source.
 */
export function getImageDimensions(base64Src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64Src.startsWith('data:') ? base64Src : `data:image/png;base64,${base64Src}`;
  });
}

/**
 * Calls the Gemini API for image editing (recoloring).
 */
export async function callGeminiApi({ base64ImageData, mimeType, prompt }: GeminiApiOptions): Promise<string> {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error('Please set your Gemini API key in /components/gemini-api.ts');
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64ImageData
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['IMAGE']
    },
  };

  try {
    const response = await fetch(`${API_URL_IMAGE}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    const base64Data = result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64Data) {
      console.error('API Error Result:', JSON.stringify(result, null, 2));
      throw new Error('No image data found in API response.');
    }

    return base64Data;

  } catch (error) {
    console.error('Error in callGeminiApi:', error);
    throw error;
  }
}
