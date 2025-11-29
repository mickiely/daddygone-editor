/**
 * AI-Powered Layer Detection using Gemini Vision API
 * Intelligently segments an image into separate layers
 */

export interface DetectedObject {
  id: number;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  mask?: ImageData;
  confidence: number;
}

/**
 * Detect objects in an image using Gemini Vision API
 */
export async function detectLayersWithAI(
  canvas: HTMLCanvasElement,
  apiKey?: string
): Promise<DetectedObject[]> {
  try {
    // Convert canvas to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    const API_KEY = apiKey || 'YOUR_GEMINI_API_KEY';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this image and identify all distinct objects, people, or elements that could be separated into individual layers. For each object, provide:
1. A descriptive name (e.g., "Person", "Car", "Tree", "Background")
2. Approximate bounding box coordinates as percentages (x, y, width, height where 0-100)
3. Confidence score (0-1)

Return ONLY a valid JSON array in this exact format:
[
  {
    "name": "object name",
    "bounds": {"x": 10, "y": 20, "width": 30, "height": 40},
    "confidence": 0.95
  }
]

Be specific with object names and include all visible objects. If there's a clear background, include it as a layer.`,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from API');
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const detectedObjects = JSON.parse(jsonText);

    // Convert percentage bounds to pixel coordinates
    return detectedObjects.map((obj: any, index: number) => ({
      id: index + 1,
      name: obj.name,
      bounds: {
        x: Math.round((obj.bounds.x / 100) * canvas.width),
        y: Math.round((obj.bounds.y / 100) * canvas.height),
        width: Math.round((obj.bounds.width / 100) * canvas.width),
        height: Math.round((obj.bounds.height / 100) * canvas.height),
      },
      confidence: obj.confidence || 0.8,
    }));
  } catch (error) {
    console.error('AI layer detection failed:', error);
    // Fallback to simple grid-based detection
    return fallbackDetection(canvas);
  }
}

/**
 * Fallback detection method - divides image into regions based on color similarity
 */
function fallbackDetection(canvas: HTMLCanvasElement): DetectedObject[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const objects: DetectedObject[] = [];

  // Simple edge detection to find distinct regions
  const regions = findColorRegions(imageData, canvas.width, canvas.height);

  regions.forEach((region, index) => {
    objects.push({
      id: index + 1,
      name: `Object ${index + 1}`,
      bounds: region,
      confidence: 0.7,
    });
  });

  return objects;
}

/**
 * Find distinct color regions in the image
 */
function findColorRegions(
  imageData: ImageData,
  width: number,
  height: number
): Array<{ x: number; y: number; width: number; height: number }> {
  const regions: Array<{ x: number; y: number; width: number; height: number }> = [];
  
  // Divide into a grid and detect significant color changes
  const gridSize = 4;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      // Check if this region has significant content (not just background)
      if (hasSignificantContent(imageData, x, y, cellWidth, cellHeight, width)) {
        regions.push({
          x,
          y,
          width: cellWidth,
          height: cellHeight,
        });
      }
    }
  }

  return regions;
}

/**
 * Check if a region has significant color variation (likely an object)
 */
function hasSignificantContent(
  imageData: ImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  imageWidth: number
): boolean {
  const data = imageData.data;
  const samples = 20;
  const colors: number[] = [];

  for (let i = 0; i < samples; i++) {
    const sx = x + Math.random() * w;
    const sy = y + Math.random() * h;
    const idx = (Math.floor(sy) * imageWidth + Math.floor(sx)) * 4;
    
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const brightness = (r + g + b) / 3;
    
    colors.push(brightness);
  }

  // Calculate variance
  const mean = colors.reduce((a, b) => a + b, 0) / colors.length;
  const variance = colors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / colors.length;

  // Higher variance = more detail = likely an object
  return variance > 100;
}

/**
 * Extract a specific object from the canvas based on bounds
 */
export function extractLayerFromBounds(
  canvas: HTMLCanvasElement,
  bounds: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = bounds.width;
  layerCanvas.height = bounds.height;
  
  const ctx = layerCanvas.getContext('2d');
  if (!ctx) return layerCanvas;

  const sourceCtx = canvas.getContext('2d');
  if (!sourceCtx) return layerCanvas;

  // Draw the extracted region
  ctx.drawImage(
    canvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  );

  return layerCanvas;
}

/**
 * Create a smart mask for an object using flood fill from center point
 */
export function createSmartMask(
  canvas: HTMLCanvasElement,
  bounds: { x: number; y: number; width: number; height: number },
  tolerance: number = 30
): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get context');

  const imageData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
  const mask = ctx.createImageData(bounds.width, bounds.height);

  // Start flood fill from center of bounds
  const centerX = Math.floor(bounds.width / 2);
  const centerY = Math.floor(bounds.height / 2);

  const visited = new Set<string>();
  const queue: [number, number][] = [[centerX, centerY]];

  const startIdx = (centerY * bounds.width + centerX) * 4;
  const targetR = imageData.data[startIdx];
  const targetG = imageData.data[startIdx + 1];
  const targetB = imageData.data[startIdx + 2];

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= bounds.width || y < 0 || y >= bounds.height) continue;

    visited.add(key);

    const idx = (y * bounds.width + x) * 4;
    const r = imageData.data[idx];
    const g = imageData.data[idx + 1];
    const b = imageData.data[idx + 2];

    const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);

    if (diff <= tolerance) {
      mask.data[idx + 3] = 255; // Set alpha to opaque
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  return mask;
}
