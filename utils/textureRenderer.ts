import { TextureConfig } from '@/types/texture';
import * as THREE from 'three';

export async function createTextureCanvas(
  config: TextureConfig,
  outputWidth: number = 2048,
  outputHeight: number = 2048
): Promise<HTMLCanvasElement> {
  const { pattern, material, patternSettings, materialSettings, jointSettings, adjustments } = config;

  if (!pattern || !material) {
    throw new Error('Pattern and material are required');
  }

  // Create a canvas for the final texture
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = outputWidth;
  textureCanvas.height = outputHeight;
  const ctx = textureCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Load material image
  const materialImg = await loadImage(material.imageUrl);
  
  // Apply adjustments to material
  const adjustedMaterial = await applyAdjustments(materialImg, adjustments);

  // Load pattern SVG if exists
  let patternImg: HTMLImageElement | null = null;
  if (pattern.svgUrl) {
    try {
      patternImg = await loadPatternSVG(pattern.svgUrl);
      console.log('Pattern SVG loaded successfully:', pattern.name);
    } catch (error) {
      console.warn('Failed to load pattern SVG:', pattern.svgUrl, error);
      // Fallback to a simple square pattern if SVG fails to load
      patternImg = await createFallbackPatternSVG();
    }
  } else {
    // If no SVG URL, use a fallback (e.g., a simple square)
    patternImg = await createFallbackPatternSVG();
  }

  // Calculate pattern tile dimensions based on pattern settings
  const rows = patternSettings.rows;
  const columns = patternSettings.columns;
  
  // The pattern defines a unit tile that gets repeated
  // Calculate the size of one pattern unit based on the output dimensions
  const patternUnitWidth = outputWidth / columns;
  const patternUnitHeight = outputHeight / rows;

  // First, draw the material as a seamless background (tiled)
  // Material should tile based on its own dimensions
  const materialTileWidth = (materialSettings.width / patternSettings.width) * patternUnitWidth;
  const materialTileHeight = (materialSettings.height / patternSettings.height) * patternUnitHeight;

  // Fill entire canvas with tiled material
  for (let y = 0; y < outputHeight; y += materialTileHeight) {
    for (let x = 0; x < outputWidth; x += materialTileWidth) {
      ctx.drawImage(adjustedMaterial, x, y, materialTileWidth, materialTileHeight);
    }
  }

  // Apply tint if needed
  if (materialSettings.tint !== '#FFFFFF') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = materialSettings.tint;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Apply pattern mask - the pattern SVG defines tile shapes
  // The pattern "zooms out" based on rows/columns - this is the key to how Architextures works
  // More rows/columns = smaller pattern units = pattern appears to zoom out and repeat more
  if (patternImg && patternImg.complete && patternImg.naturalWidth > 0) {
    ctx.save();
    
    // Create pattern mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = outputWidth;
    maskCanvas.height = outputHeight;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (maskCtx) {
      // Start with transparent canvas (all hidden by default)
      // Material will only show where pattern shapes are (where we set alpha = 255)
      maskCtx.clearRect(0, 0, outputWidth, outputHeight);
      
      // Tile the pattern SVG across the canvas
      // The pattern SVG defines one "unit" of the pattern with filled black shapes
      // We repeat it based on rows/columns - this creates the "zoom out" effect
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = col * patternUnitWidth;
          const y = row * patternUnitHeight;
          
          // Draw the pattern SVG - it has black filled shapes defining where tiles should be
          // The SVG modification in loadPatternSVG ensures paths are filled with black
          maskCtx.drawImage(
            patternImg,
            x,
            y,
            patternUnitWidth,
            patternUnitHeight
          );
        }
      }
      
      // Process the mask: pattern SVG has black filled shapes on transparent/white background
      // Material should show INSIDE the pattern shapes (where black pixels are)
      // Material should NOT show outside (where white/transparent pixels are)
      const maskImageData = maskCtx.getImageData(0, 0, outputWidth, outputHeight);
      const maskData = maskImageData.data;
      
      let darkPixelCount = 0;
      let lightPixelCount = 0;
      
      // Convert pattern to mask: black shapes (pattern) = visible, white/transparent = hidden
      for (let i = 0; i < maskData.length; i += 4) {
        const r = maskData[i];
        const g = maskData[i + 1];
        const b = maskData[i + 2];
        const a = maskData[i + 3];
        
        // Calculate brightness to determine if pixel is part of pattern shape
        const brightness = (r + g + b) / 3;
        
        // Pattern shapes are black (brightness ~0), background is white/transparent (brightness ~255)
        // For destination-in: material shows where mask alpha = 255
        // Black pixels (pattern shapes) → alpha = 255 (material visible)
        // White/light pixels (background) → alpha = 0 (material hidden)
        if (brightness < 128 && a > 50) {
          // Dark pixel (part of pattern shape) = make visible
          maskData[i + 3] = 255;
          darkPixelCount++;
        } else {
          // Light/white/transparent pixel (background) = make hidden
          maskData[i + 3] = 0;
          lightPixelCount++;
        }
      }
      
      console.log(`Pattern mask processed: ${darkPixelCount} dark pixels (visible), ${lightPixelCount} light pixels (hidden)`);
      
      // Safety check: ensure at least some pixels are visible
      // If mask is completely transparent, show full material as fallback
      if (darkPixelCount === 0) {
        console.warn('Pattern mask has no dark pixels - pattern shapes not detected. Showing full material as fallback.');
        // Make entire mask visible as fallback
        for (let i = 3; i < maskData.length; i += 4) {
          maskData[i] = 255;
        }
      }
      
      maskCtx.putImageData(maskImageData, 0, 0);
      
      // Use destination-in: keeps material only where pattern mask has opaque pixels
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      
      // Reset composite operation to default
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.restore();
  } else {
    // If pattern image failed to load, log a warning but continue
    console.warn('Pattern image not available, showing material without pattern mask');
  }

  // Draw joints only if explicitly enabled and values are set
  // Joints should be subtle and only show when user wants them
  // Default to true if enabled is undefined (backward compatibility)
  const jointsEnabled = jointSettings.enabled !== undefined ? jointSettings.enabled : true;
  if (jointsEnabled && (jointSettings.horizontal > 0 || jointSettings.vertical > 0)) {
    ctx.save();
    ctx.fillStyle = jointSettings.tint;
    ctx.globalAlpha = 0.6; // Make joints more subtle

    // Draw horizontal joints
    if (jointSettings.horizontal > 0) {
      const jointHeight = (jointSettings.horizontal / patternSettings.height) * patternUnitHeight;
      // Only draw if joint height is meaningful (at least 1 pixel)
      if (jointHeight >= 1) {
        for (let row = 1; row < rows; row++) {
          const y = row * patternUnitHeight;
          ctx.fillRect(0, y - jointHeight / 2, outputWidth, jointHeight);
        }
      }
    }

    // Draw vertical joints
    if (jointSettings.vertical > 0) {
      const jointWidth = (jointSettings.vertical / patternSettings.width) * patternUnitWidth;
      // Only draw if joint width is meaningful (at least 1 pixel)
      if (jointWidth >= 1) {
        for (let col = 1; col < columns; col++) {
          const x = col * patternUnitWidth;
          ctx.fillRect(x - jointWidth / 2, 0, jointWidth, outputHeight);
        }
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
): Promise<THREE.Texture> {
  const canvas = await createTextureCanvas(config, outputWidth, outputHeight);
  
  // Convert canvas to Three.js texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
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
  try {
    // Fetch SVG as text so we can modify it
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let svgText = await response.text();
    
    // Modify SVG to fill the paths instead of just stroking them
    // Architextures SVGs have fill:none and stroke:#000, we need to fill the shapes
    // The pattern SVG defines tile shapes - we want these shapes filled with black
    
    // Replace fill:none with fill:#000000 (black fill)
    svgText = svgText.replace(/fill:\s*none/gi, 'fill:#000000');
    svgText = svgText.replace(/fill="none"/gi, 'fill="#000000"');
    svgText = svgText.replace(/fill='none'/gi, "fill='#000000'");
    
    // Convert strokes to fills by removing stroke and ensuring fill is set
    // If element has stroke but no fill, add fill with the stroke color
    svgText = svgText.replace(/stroke="([^"]*)"/gi, (match, strokeColor) => {
      // Keep stroke for now, but we'll ensure fill is set
      return match;
    });
    
    // Ensure all path elements have fill (prefer existing fill, otherwise add black fill)
    svgText = svgText.replace(/<path([^>]*?)>/gi, (match, attrs) => {
      // If path doesn't have fill attribute, add it
      if (!attrs.includes('fill=') && !attrs.includes('fill:')) {
        return `<path${attrs} fill="#000000">`;
      }
      // If path has fill="none", replace it
      if (attrs.includes('fill="none"') || attrs.includes("fill='none'")) {
        return `<path${attrs.replace(/fill=["']none["']/gi, 'fill="#000000"')}>`;
      }
      return match;
    });
    
    // Also handle other shape elements (rect, circle, etc.)
    svgText = svgText.replace(/<(rect|circle|ellipse|polygon|polyline)([^>]*?)>/gi, (match, tag, attrs) => {
      if (!attrs.includes('fill=') && !attrs.includes('fill:')) {
        return `<${tag}${attrs} fill="#000000">`;
      }
      if (attrs.includes('fill="none"') || attrs.includes("fill='none'")) {
        return `<${tag}${attrs.replace(/fill=["']none["']/gi, 'fill="#000000"')}>`;
      }
      return match;
    });
    
    // Create blob URL from modified SVG
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    
    // Load as image
    const img = await loadImage(blobUrl);
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
    
    return img;
  } catch (error) {
    console.warn('Failed to fetch and modify SVG, trying direct load:', error);
    // Fallback to direct image load
    try {
      return await loadImage(url);
    } catch (directError) {
      console.warn('Direct load also failed, using fallback pattern:', directError);
      // If both fail, use a simple fallback pattern
      return await createFallbackPatternSVG();
    }
  }
}

// Function to create a fallback square pattern SVG
async function createFallbackPatternSVG(): Promise<HTMLImageElement> {
  const svgText = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100" height="100" fill="white"/>
  </svg>`;
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgObjectUrl = URL.createObjectURL(svgBlob);
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => {
      URL.revokeObjectURL(svgObjectUrl);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgObjectUrl);
      console.error('Failed to create fallback SVG image.');
      resolve();
    };
    img.src = svgObjectUrl;
  });
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

