import { TextureConfig, Pattern, Material } from '@/types/texture';

export async function generateTexture(
  config: TextureConfig,
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { pattern, material, patternSettings, materialSettings, jointSettings, adjustments } = config;

  // Use canvas dimensions if set, otherwise use default preview size
  const previewWidth = canvas.width || 800;
  const previewHeight = canvas.height || 600;
  
  if (!canvas.width) canvas.width = previewWidth;
  if (!canvas.height) canvas.height = previewHeight;

  // Clear canvas
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, previewWidth, previewHeight);

  if (!pattern || !material) {
    return;
  }

  // Calculate tile dimensions based on pattern settings
  const tileWidth = patternSettings.width;
  const tileHeight = patternSettings.height;
  const rows = patternSettings.rows;
  const columns = patternSettings.columns;

  // Load pattern SVG if exists - fetch as text to avoid CORS issues
  let patternImg: HTMLImageElement | null = null;
  let patternLoaded = false;
  if (pattern.svgUrl) {
    try {
      // Fetch SVG as text to bypass CORS
      const response = await fetch(pattern.svgUrl, { mode: 'cors' });
      if (response.ok) {
        const svgText = await response.text();
        // Convert SVG text to data URL
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        patternImg = new Image();
        await new Promise<void>((resolve) => {
          patternImg!.onload = () => {
            if (patternImg && patternImg.complete && patternImg.naturalWidth > 0 && patternImg.naturalHeight > 0) {
              patternLoaded = true;
            }
            URL.revokeObjectURL(svgUrl); // Clean up
            resolve();
          };
          patternImg!.onerror = () => {
            console.warn(`Failed to load pattern SVG from blob: ${pattern.svgUrl}`);
            patternImg = null;
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          patternImg!.src = svgUrl;
        });
      } else {
        console.warn(`Failed to fetch pattern SVG: ${pattern.svgUrl} - Status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Error fetching pattern SVG: ${pattern.svgUrl}`, error);
      // Fallback: try direct image load (may fail due to CORS)
      patternImg = new Image();
      patternImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        patternImg!.onload = () => {
          if (patternImg && patternImg.complete && patternImg.naturalWidth > 0 && patternImg.naturalHeight > 0) {
            patternLoaded = true;
          }
          resolve();
        };
        patternImg!.onerror = () => {
          console.warn(`Failed to load pattern SVG (fallback): ${pattern.svgUrl}`);
          patternImg = null;
          resolve();
        };
        patternImg!.src = pattern.svgUrl;
      });
    }
  }

  // Load material image
  const materialImg = new Image();
  materialImg.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    materialImg.onload = () => resolve();
    materialImg.onerror = () => {
      // Create a fallback colored rectangle if image fails to load
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 200;
      fallbackCanvas.height = 200;
      const fallbackCtx = fallbackCanvas.getContext('2d');
      if (fallbackCtx) {
        fallbackCtx.fillStyle = '#cccccc';
        fallbackCtx.fillRect(0, 0, 200, 200);
        // Draw the fallback as the material image
        materialImg.src = fallbackCanvas.toDataURL();
        materialImg.onload = () => resolve();
        materialImg.onerror = () => reject(new Error('Failed to load material image'));
      } else {
        reject(new Error('Failed to create fallback canvas'));
      }
    };
    materialImg.src = material.imageUrl;
  });

  // Apply adjustments to material
  const adjustedMaterial = await applyAdjustments(materialImg, adjustments);

  // Draw pattern with material - tile across the canvas
  const patternWidth = previewWidth / columns;
  const patternHeight = previewHeight / rows;

  // Draw material across entire canvas first (as base layer)
  if (materialSettings.tint !== '#FFFFFF') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = materialSettings.tint;
    ctx.fillRect(0, 0, previewWidth, previewHeight);
    ctx.globalCompositeOperation = 'multiply';
  }

  // Draw material texture across entire canvas
  ctx.drawImage(
    adjustedMaterial,
    0,
    0,
    previewWidth,
    previewHeight
  );

  // Apply pattern mask by tiling the SVG pattern
  if (patternImg && patternLoaded && patternImg.complete && patternImg.naturalWidth > 0) {
    ctx.save();
    
    // Create a temporary canvas for the pattern mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = previewWidth;
    maskCanvas.height = previewHeight;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (maskCtx) {
      // Fill with white (fully visible)
      maskCtx.fillStyle = '#ffffff';
      maskCtx.fillRect(0, 0, previewWidth, previewHeight);
      
      // Tile the pattern SVG across the mask
      // Verify image is valid before drawing
      if (patternImg.complete && patternImg.naturalWidth > 0 && patternImg.naturalHeight > 0) {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            const x = col * patternWidth;
            const y = row * patternHeight;
            try {
              maskCtx.drawImage(
                patternImg,
                x,
                y,
                patternWidth,
                patternHeight
              );
            } catch (error) {
              console.warn('Failed to draw pattern tile:', error);
              // Continue with other tiles even if one fails
            }
          }
        }
      } else {
        console.warn('Pattern image not ready:', {
          complete: patternImg.complete,
          naturalWidth: patternImg.naturalWidth,
          naturalHeight: patternImg.naturalHeight
        });
      }
      
      // Use the mask to clip the material
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
    }
    
    ctx.restore();
  }

  // Draw joints if enabled
  if (jointSettings.horizontal > 0 || jointSettings.vertical > 0) {
    ctx.save();
    ctx.fillStyle = jointSettings.tint;
    ctx.globalAlpha = 0.8;

    const patternWidth = previewWidth / columns;
    const patternHeight = previewHeight / rows;

    // Draw horizontal joints
    if (jointSettings.horizontal > 0) {
      const jointHeight = (jointSettings.horizontal / tileHeight) * patternHeight;
      for (let row = 1; row < rows; row++) {
        const y = row * patternHeight;
        ctx.fillRect(0, y - jointHeight / 2, previewWidth, jointHeight);
      }
    }

    // Draw vertical joints
    if (jointSettings.vertical > 0) {
      const jointWidth = (jointSettings.vertical / tileWidth) * patternWidth;
      for (let col = 1; col < columns; col++) {
        const x = col * patternWidth;
        ctx.fillRect(x - jointWidth / 2, 0, jointWidth, previewHeight);
      }
    }

    ctx.restore();
  }
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

    // Hue rotation (simplified)
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

