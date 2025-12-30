'use client';

import { useEffect, useRef } from 'react';
import { TextureConfig } from '@/types/texture';
import { generateTexture } from '@/utils/textureGenerator';

interface TextureCanvasProps {
  config: TextureConfig;
  className?: string;
}

export default function TextureCanvas({ config, className }: TextureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Set canvas dimensions based on container
      const container = canvasRef.current.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvasRef.current.width = rect.width || 800;
        canvasRef.current.height = rect.height || 600;
      }
      generateTexture(config, canvasRef.current).catch(console.error);
    }
  }, [config]);

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {(!config.pattern || !config.material) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <p>Select a pattern and material to preview</p>
        </div>
      )}
    </div>
  );
}

