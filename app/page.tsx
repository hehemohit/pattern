'use client';

import { useState } from 'react';
import { TextureConfig, Pattern, Material } from '@/types/texture';
import { patterns } from '@/data/patterns';
import { materials } from '@/data/materials';
import TextureCanvas from '@/components/TextureCanvas';
import Texture3DViewer from '@/components/Texture3DViewer';
import PatternSelector from '@/components/PatternSelector';
import MaterialSelector from '@/components/MaterialSelector';
import ControlPanel from '@/components/ControlPanel';

const defaultConfig: TextureConfig = {
  pattern: patterns.find(p => p.id === 'herringbone') || null,
  material: null, // Start without material to see patterns clearly
  patternSettings: {
    rows: 6,
    columns: 4,
    width: 400,
    height: 100,
  },
  materialSettings: {
    width: 400,
    height: 100,
    tint: '#FFFFFF',
    edgeStyle: 'Handmade',
    toneVariation: 0.25,
  },
  jointSettings: {
    material: 'Mortar',
    tint: '#FFFFFF',
    horizontal: 5,
    vertical: 5,
    recess: true,
    concave: false,
  },
  adjustments: {
    brightness: 1,
    contrast: 1,
    hue: 0,
    saturation: 1,
    invert: false,
  },
};

export default function Home() {
  const [config, setConfig] = useState<TextureConfig>(defaultConfig);
  const [showPatternSelector, setShowPatternSelector] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [customMaterials, setCustomMaterials] = useState<Material[]>(() => {
    // Load custom materials from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customMaterials');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const handlePatternSelect = (pattern: Pattern) => {
    console.log('Pattern selected:', pattern.name, pattern.id);
    setConfig({
      ...config,
      pattern: { ...pattern }, // Create new object to ensure React detects change
      patternSettings: {
        ...config.patternSettings,
        rows: pattern.defaultRows || config.patternSettings.rows,
        columns: pattern.defaultColumns || config.patternSettings.columns,
      },
    });
  };

  const handleMaterialSelect = (material: Material) => {
    setConfig({
      ...config,
      material,
    });
  };

  const handleAddCustomMaterial = (material: Material) => {
    const updated = [...customMaterials, material];
    setCustomMaterials(updated);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('customMaterials', JSON.stringify(updated));
    }
    // Auto-select the new material
    handleMaterialSelect(material);
  };

  // Combine default materials with custom materials
  const allMaterials = [...materials, ...customMaterials];

  const handleDownload = async () => {
    if (!config.pattern) {
      alert('Please select a pattern first');
      return;
    }

    try {
      const { createTextureCanvas } = await import('@/utils/textureRenderer');
      const canvas = await createTextureCanvas(config, 2048, 2048);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `texture-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to download texture:', error);
      alert('Failed to generate texture. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Texture Editor</h1>
          <p className="text-gray-600 mt-2">Create seamless textures with patterns and materials</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pattern Selection */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Pattern</h3>
              <button
                onClick={() => setShowPatternSelector(true)}
                className="w-full px-4 py-2 border rounded-md hover:bg-gray-50 text-left flex items-center justify-between"
              >
                <span className={config.pattern ? 'text-gray-900' : 'text-gray-400'}>
                  {config.pattern?.name || 'Select Pattern'}
                </span>
                <span className="text-gray-400">▼</span>
              </button>
            </div>

            {/* Material Selection */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Material</h3>
              <button
                onClick={() => setShowMaterialSelector(true)}
                className="w-full px-4 py-2 border rounded-md hover:bg-gray-50 text-left flex items-center justify-between"
              >
                <span className={config.material ? 'text-gray-900' : 'text-gray-400'}>
                  {config.material?.name || 'Select Material'}
                </span>
                <span className="text-gray-400">▼</span>
              </button>
            </div>

            {/* Control Panel */}
            <ControlPanel config={config} onConfigChange={setConfig} />

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!config.pattern || !config.material}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Download Texture
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border overflow-hidden flex flex-col" style={{ height: '600px' }}>
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold">Preview</h3>
              </div>
              <div className="flex-1 min-h-0">
                <Texture3DViewer config={config} className="w-full h-full" />
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      {showPatternSelector && (
        <PatternSelector
          patterns={patterns}
          selectedPattern={config.pattern}
          onSelect={handlePatternSelect}
          onClose={() => setShowPatternSelector(false)}
        />
      )}

      {showMaterialSelector && (
        <MaterialSelector
          materials={allMaterials}
          selectedMaterial={config.material}
          onSelect={handleMaterialSelect}
          onClose={() => setShowMaterialSelector(false)}
          onAddCustom={handleAddCustomMaterial}
        />
      )}
    </div>
  );
}
