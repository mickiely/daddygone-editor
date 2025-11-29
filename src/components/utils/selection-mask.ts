export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MaskResult {
  mask: Uint8ClampedArray;
  width: number;
  height: number;
  bbox: BoundingBox | null;
}

// Flood fill based on a seed click and tolerance (Manhattan distance across RGB)
export function createSelectionMaskFromSeed(
  imageData: ImageData,
  seedX: number,
  seedY: number,
  tolerance: number
): MaskResult {
  const { width, height, data } = imageData;
  const mask = new Uint8ClampedArray(width * height);
  const visited = new Uint8Array(width * height);
  const queue: Array<[number, number]> = [];

  const idx = (seedY * width + seedX) * 4;
  const startR = data[idx];
  const startG = data[idx + 1];
  const startB = data[idx + 2];

  queue.push([seedX, seedY]);

  let minX = width, minY = height, maxX = 0, maxY = 0;

  while (queue.length > 0) {
    const [x, y] = queue.pop() as [number, number];
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const flat = y * width + x;
    if (visited[flat]) continue;
    visited[flat] = 1;

    const i = flat * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB);
    if (diff <= tolerance) {
      mask[flat] = 255;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
  }

  const hasPixels = minX <= maxX && minY <= maxY;
  const bbox = hasPixels
    ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
    : null;

  return { mask, width, height, bbox };
}

// Simple morphological grow/shrink. Positive = dilate, negative = erode.
export function growShrinkMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
): Uint8ClampedArray {
  if (amount === 0) return new Uint8ClampedArray(mask);

  const iterations = Math.min(Math.abs(amount), 10);
  let current = new Uint8ClampedArray(mask);

  const neighbors = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const value = current[idx] > 0;
        if (amount > 0) {
          if (value) {
            next[idx] = 255;
          } else {
            for (const [dx, dy] of neighbors) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (current[ny * width + nx] > 0) {
                  next[idx] = 255;
                  break;
                }
              }
            }
          }
        } else {
          if (!value) continue;
          let allNeighbors = true;
          for (const [dx, dy] of neighbors) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            if (current[ny * width + nx] === 0) {
              allNeighbors = false;
              break;
            }
          }
          if (allNeighbors) next[idx] = 255;
        }
      }
    }
    current = next;
  }

  return current;
}

// Basic box blur on alpha channel for feathering
export function featherMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  if (radius <= 0) return new Uint8ClampedArray(mask);

  const temp = new Float32Array(width * height);
  const output = new Uint8ClampedArray(width * height);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) {
      const clampedX = Math.min(width - 1, Math.max(0, x));
      sum += mask[y * width + clampedX];
    }
    for (let x = 0; x < width; x++) {
      temp[y * width + x] = sum / (radius * 2 + 1);
      const removeX = x - radius;
      const addX = x + radius + 1;
      if (removeX >= 0) sum -= mask[y * width + removeX];
      if (addX < width) sum += mask[y * width + addX];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
      const clampedY = Math.min(height - 1, Math.max(0, y));
      sum += temp[clampedY * width + x];
    }
    for (let y = 0; y < height; y++) {
      const alpha = sum / (radius * 2 + 1);
      output[y * width + x] = Math.max(0, Math.min(255, Math.round(alpha)));
      const removeY = y - radius;
      const addY = y + radius + 1;
      if (removeY >= 0) sum -= temp[removeY * width + x];
      if (addY < height) sum += temp[addY * width + x];
    }
  }

  return output;
}

export function getMaskBoundingBox(
  mask: Uint8ClampedArray,
  width: number,
  height: number
): BoundingBox | null {
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function extractStickerCanvas(
  sourceCanvas: HTMLCanvasElement,
  alphaMask: Uint8ClampedArray,
  bbox: BoundingBox
): HTMLCanvasElement | null {
  const { width, height } = sourceCanvas;
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return null;

  const output = document.createElement('canvas');
  output.width = bbox.width;
  output.height = bbox.height;
  const outCtx = output.getContext('2d');
  if (!outCtx) return null;

  const srcData = ctx.getImageData(bbox.x, bbox.y, bbox.width, bbox.height);
  const outData = outCtx.createImageData(bbox.width, bbox.height);

  for (let y = 0; y < bbox.height; y++) {
    for (let x = 0; x < bbox.width; x++) {
      const srcX = bbox.x + x;
      const srcY = bbox.y + y;
      const srcIdx = (srcY * width + srcX) * 4;
      const maskAlpha = alphaMask[srcY * width + srcX] / 255;

      const outIdx = (y * bbox.width + x) * 4;
      outData.data[outIdx] = srcData.data[(y * bbox.width + x) * 4];
      outData.data[outIdx + 1] = srcData.data[(y * bbox.width + x) * 4 + 1];
      outData.data[outIdx + 2] = srcData.data[(y * bbox.width + x) * 4 + 2];
      outData.data[outIdx + 3] = Math.round(srcData.data[(y * bbox.width + x) * 4 + 3] * maskAlpha);
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return output;
}
