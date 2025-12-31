import { TextureConfig } from '@/types/texture';
import * as THREE from 'three';

/**
 * Creates a texture canvas based on Architextures' approach:
 * 1. Pattern SVG defines tile shapes (where material should appear)
 * 2. Material fills within those pattern-defined tiles
 * 3. Pattern "zooms out" based on rows/columns (more rows/columns = smaller pattern units)
 */
export async function createTextureCanvas(
  config: TextureConfig,
  outputWidth: number = 2048,
  outputHeight: number = 2048
): Promise<HTMLCanvasElement> {
  const { pattern, material, patternSettings, materialSettings, jointSettings, adjustments } = config;

  if (!pattern) {
    throw new Error('Pattern is required');
  }

  // Create a canvas for the final texture
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = outputWidth;
  textureCanvas.height = outputHeight;
  const ctx = textureCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Load pattern SVG - this defines the tile shapes
  let patternImg: HTMLImageElement | null = null;
  if (pattern.svgUrl) {
    try {
      patternImg = await loadPatternSVG(pattern.svgUrl);
    } catch (error) {
      console.warn('Failed to load pattern SVG:', pattern.svgUrl, error);
    }
  }

  // Calculate pattern tile dimensions
  const rows = patternSettings.rows;
  const columns = patternSettings.columns;
  const patternUnitWidth = outputWidth / columns;
  const patternUnitHeight = outputHeight / rows;

  // If no material, show pattern directly with clear colors
  if (!material) {
    // Clear canvas with light background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Draw pattern shapes directly in dark color
    if (patternImg && patternImg.complete && patternImg.naturalWidth > 0) {
      ctx.fillStyle = '#333333'; // Dark gray for pattern
      
      // Tile the pattern SVG across the canvas
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = col * patternUnitWidth;
          const y = row * patternUnitHeight;
          
          ctx.drawImage(
            patternImg,
            x,
            y,
            patternUnitWidth,
            patternUnitHeight
          );
        }
      }
    } else {
      // If pattern failed to load, show a grid
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      for (let row = 1; row < rows; row++) {
        const y = row * patternUnitHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(outputWidth, y);
        ctx.stroke();
      }
      for (let col = 1; col < columns; col++) {
        const x = col * patternUnitWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, outputHeight);
        ctx.stroke();
      }
    }

    // Draw joints if enabled
    if (jointSettings.horizontal > 0 || jointSettings.vertical > 0) {
      ctx.save();
      ctx.fillStyle = jointSettings.tint;
      ctx.globalAlpha = 0.8;

      if (jointSettings.horizontal > 0) {
        const jointHeight = (jointSettings.horizontal / patternSettings.height) * patternUnitHeight;
        for (let row = 1; row < rows; row++) {
          const y = row * patternUnitHeight;
          ctx.fillRect(0, y - jointHeight / 2, outputWidth, jointHeight);
        }
      }

      if (jointSettings.vertical > 0) {
        const jointWidth = (jointSettings.vertical / patternSettings.width) * patternUnitWidth;
        for (let col = 1; col < columns; col++) {
          const x = col * patternUnitWidth;
          ctx.fillRect(x - jointWidth / 2, 0, jointWidth, outputHeight);
        }
      }

      ctx.restore();
    }

    return textureCanvas;
  }

  // Material-based rendering
  // Clear canvas with background color
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  // Load material image
  const materialImg = await loadImage(material.imageUrl);
  
  // Apply adjustments to material
  const adjustedMaterial = await applyAdjustments(materialImg, adjustments);

  // Step 1: Draw material as a SINGLE image covering the entire canvas
  // Material size doesn't change with rows/columns - it's always full canvas
  ctx.drawImage(adjustedMaterial, 0, 0, outputWidth, outputHeight);

  // Step 2: Apply tint if needed
  if (materialSettings.tint !== '#FFFFFF') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = materialSettings.tint;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Step 3: Draw pattern ON TOP of the material so it's visible
  // The pattern defines the tile arrangement and should be visible over the material
  if (patternImg && patternImg.complete && patternImg.naturalWidth > 0) {
    ctx.save();
    
    // Draw pattern as overlay - use multiply blend mode to darken where pattern lines are
    // This makes the pattern visible on top of the material
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.4; // Semi-transparent so material shows through but pattern is visible
    
    // Tile the pattern SVG on top of the material
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * patternUnitWidth;
        const y = row * patternUnitHeight;
        
        ctx.drawImage(
          patternImg,
          x,
          y,
          patternUnitWidth,
          patternUnitHeight
        );
      }
    }
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Step 4: Draw joints if enabled
  if (jointSettings.horizontal > 0 || jointSettings.vertical > 0) {
    ctx.save();
    ctx.fillStyle = jointSettings.tint;
    ctx.globalAlpha = 0.8;

    // Draw horizontal joints
    if (jointSettings.horizontal > 0) {
      const jointHeight = (jointSettings.horizontal / patternSettings.height) * patternUnitHeight;
      for (let row = 1; row < rows; row++) {
        const y = row * patternUnitHeight;
        ctx.fillRect(0, y - jointHeight / 2, outputWidth, jointHeight);
      }
    }

    // Draw vertical joints
    if (jointSettings.vertical > 0) {
      const jointWidth = (jointSettings.vertical / patternSettings.width) * patternUnitWidth;
      for (let col = 1; col < columns; col++) {
        const x = col * patternUnitWidth;
        ctx.fillRect(x - jointWidth / 2, 0, jointWidth, outputHeight);
      }
    }

    ctx.restore();
  }

  return textureCanvas;
}

export async function createTextureFromConfig(
  config: TextureConfig,
  outputWidth: number = 2048,
  outputHeight: number = 2048
): Promise<{ map: THREE.Texture; displacementMap: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }> {
  const canvas = await createTextureCanvas(config, outputWidth, outputHeight);
  
  // Convert canvas to Three.js texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  // Create displacement map (depth information) - returns both texture and canvas
  const { texture: displacementMap, canvas: displacementCanvas } = await createDisplacementMap(config, outputWidth, outputHeight);
  
  // Create normal map (surface detail) from displacement canvas
  const normalMap = await createNormalMap(displacementCanvas, outputWidth, outputHeight);
  
  // Create roughness map (surface roughness)
  const roughnessMap = await createRoughnessMap(config, outputWidth, outputHeight);

  return { map: texture, displacementMap, normalMap, roughnessMap };
}

/**
 * Creates a displacement map where joints are deep (dark) and tiles are raised (light)
 */
async function createDisplacementMap(
  config: TextureConfig,
  outputWidth: number,
  outputHeight: number
): Promise<{ texture: THREE.Texture; canvas: HTMLCanvasElement }> {
  const { pattern, patternSettings, jointSettings } = config;
  
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Start with white (raised tiles)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  const rows = patternSettings.rows;
  const columns = patternSettings.columns;
  const patternUnitWidth = outputWidth / columns;
  const patternUnitHeight = outputHeight / rows;

  // Load pattern SVG if exists
  let patternImg: HTMLImageElement | null = null;
  if (pattern?.svgUrl) {
    try {
      patternImg = await loadPatternSVG(pattern.svgUrl);
    } catch (error) {
      console.warn('Failed to load pattern SVG for displacement:', error);
    }
  }

  // Draw joints as dark areas (deep/recessed)
  ctx.fillStyle = '#000000'; // Black = deep
  ctx.globalAlpha = 1.0;

  // Horizontal joints (recessed)
  if (jointSettings.horizontal > 0) {
    const jointHeight = (jointSettings.horizontal / patternSettings.height) * patternUnitHeight;
    for (let row = 1; row < rows; row++) {
      const y = row * patternUnitHeight;
      ctx.fillRect(0, y - jointHeight / 2, outputWidth, jointHeight);
    }
  }

  // Vertical joints (recessed)
  if (jointSettings.vertical > 0) {
    const jointWidth = (jointSettings.vertical / patternSettings.width) * patternUnitWidth;
    for (let col = 1; col < columns; col++) {
      const x = col * patternUnitWidth;
      ctx.fillRect(x - jointWidth / 2, 0, jointWidth, outputHeight);
    }
  }

  // Add pattern-based depth variation
  if (patternImg && patternImg.complete && patternImg.naturalWidth > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.3; // Subtle depth variation
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * patternUnitWidth;
        const y = row * patternUnitHeight;
        
        ctx.drawImage(
          patternImg,
          x,
          y,
          patternUnitWidth,
          patternUnitHeight
        );
      }
    }
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  // Add noise for roughness
  addNoiseToDisplacement(ctx, outputWidth, outputHeight, 0.05);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return { texture, canvas };
}

/**
 * Creates a normal map from the displacement map for surface detail
 */
async function createNormalMap(
  displacementCanvas: HTMLCanvasElement,
  outputWidth: number,
  outputHeight: number
): Promise<THREE.Texture> {
  const ctx = displacementCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get displacement context');
  
  const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
  const data = imageData.data;
  
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = outputWidth;
  normalCanvas.height = outputHeight;
  const normalCtx = normalCanvas.getContext('2d');
  if (!normalCtx) throw new Error('Failed to get normal canvas context');
  
  const normalData = normalCtx.createImageData(outputWidth, outputHeight);
  const normal = normalData.data;
  
  // Calculate normals from displacement gradients
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const idx = (y * outputWidth + x) * 4;
      
      // Sample neighboring pixels for gradient
      const getHeight = (px: number, py: number) => {
        const clampedX = Math.max(0, Math.min(outputWidth - 1, px));
        const clampedY = Math.max(0, Math.min(outputHeight - 1, py));
        const i = (clampedY * outputWidth + clampedX) * 4;
        return data[i] / 255; // Normalize to 0-1
      };
      
      const height = getHeight(x, y);
      const heightL = getHeight(x - 1, y);
      const heightR = getHeight(x + 1, y);
      const heightU = getHeight(x, y - 1);
      const heightD = getHeight(x, y + 1);
      
      // Calculate normal from gradients
      const dx = (heightR - heightL) * 0.5;
      const dy = (heightD - heightU) * 0.5;
      const dz = 1.0;
      
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = (dx / length) * 0.5 + 0.5; // Convert -1..1 to 0..1
      const ny = (dy / length) * 0.5 + 0.5;
      const nz = (dz / length) * 0.5 + 0.5;
      
      // Normal map: R = X, G = Y, B = Z
      normal[idx] = nx * 255;     // R
      normal[idx + 1] = ny * 255;  // G
      normal[idx + 2] = nz * 255; // B
      normal[idx + 3] = 255;       // A
    }
  }
  
  normalCtx.putImageData(normalData, 0, 0);
  
  const texture = new THREE.CanvasTexture(normalCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Creates a roughness map for realistic surface variation
 */
async function createRoughnessMap(
  config: TextureConfig,
  outputWidth: number,
  outputHeight: number
): Promise<THREE.Texture> {
  const { patternSettings, jointSettings } = config;
  
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Base roughness (medium)
  ctx.fillStyle = '#808080'; // 50% roughness
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  const rows = patternSettings.rows;
  const columns = patternSettings.columns;
  const patternUnitWidth = outputWidth / columns;
  const patternUnitHeight = outputHeight / rows;

  // Joints are rougher (lighter = more rough in some systems, darker = more rough in others)
  // We'll make joints darker (more rough)
  ctx.fillStyle = '#404040'; // More rough
  ctx.globalAlpha = 0.8;

  if (jointSettings.horizontal > 0) {
    const jointHeight = (jointSettings.horizontal / patternSettings.height) * patternUnitHeight;
    for (let row = 1; row < rows; row++) {
      const y = row * patternUnitHeight;
      ctx.fillRect(0, y - jointHeight / 2, outputWidth, jointHeight);
    }
  }

  if (jointSettings.vertical > 0) {
    const jointWidth = (jointSettings.vertical / patternSettings.width) * patternUnitWidth;
    for (let col = 1; col < columns; col++) {
      const x = col * patternUnitWidth;
      ctx.fillRect(x - jointWidth / 2, 0, jointWidth, outputHeight);
    }
  }

  // Add noise for surface variation
  addNoiseToDisplacement(ctx, outputWidth, outputHeight, 0.1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Adds noise to displacement map for roughness
 */
function addNoiseToDisplacement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 255;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Create fallback
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 200;
      fallbackCanvas.height = 200;
      const fallbackCtx = fallbackCanvas.getContext('2d');
      if (fallbackCtx) {
        fallbackCtx.fillStyle = '#cccccc';
        fallbackCtx.fillRect(0, 0, 200, 200);
        img.src = fallbackCanvas.toDataURL();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
      } else {
        reject(new Error('Failed to create fallback canvas'));
      }
    };
    img.src = url;
  });
}

async function loadPatternSVG(url: string): Promise<HTMLImageElement> {
  // If URL is from our API route, fetch as text and convert to blob URL
  // This bypasses CORS issues
  if (url.startsWith('/api/pattern')) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch pattern: ${response.status}`);
      }
      const svgText = await response.text();
      
      // Create blob URL from SVG text
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      
      // Load as image
      const img = await loadImage(blobUrl);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
      
      return img;
    } catch (error) {
      console.warn('Failed to load pattern via API, creating fallback:', error);
      return createFallbackPattern();
    }
  }
  
  // For external URLs, try direct load
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Pattern SVG load timeout'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      if (img.complete && img.naturalWidth > 0) {
        resolve(img);
      } else {
        reject(new Error('Pattern SVG loaded but appears broken'));
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('Pattern SVG failed to load, creating fallback');
      resolve(createFallbackPattern());
    };
    
    img.src = url;
  });
}

function createFallbackPattern(): HTMLImageElement {
  // Create a simple square pattern as fallback
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 100, 100);
  }
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

async function applyAdjustments(
  image: HTMLImageElement,
  adjustments: TextureConfig['adjustments']
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r = Math.min(255, r * adjustments.brightness);
    g = Math.min(255, g * adjustments.brightness);
    b = Math.min(255, b * adjustments.brightness);

    // Contrast
    const contrastFactor = (259 * (adjustments.contrast * 255 + 255)) / (255 * (259 - adjustments.contrast * 255));
    r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
    b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));

    // Hue rotation
    if (adjustments.hue !== 0) {
      const hsv = rgbToHsv(r, g, b);
      hsv[0] = (hsv[0] + adjustments.hue / 360) % 1;
      const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
      r = rgb[0];
      g = rgb[1];
      b = rgb[2];
    }

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * adjustments.saturation;
    g = gray + (g - gray) * adjustments.saturation;
    b = gray + (b - gray) * adjustments.saturation;

    // Invert
    if (adjustments.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h /= 6;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return [h, s, v];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}
