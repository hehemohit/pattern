'use client';

import { TextureConfig } from '@/types/texture';

interface ControlPanelProps {
  config: TextureConfig;
  onConfigChange: (config: TextureConfig) => void;
}

export default function ControlPanel({ config, onConfigChange }: ControlPanelProps) {
  const updatePatternSettings = (updates: Partial<TextureConfig['patternSettings']>) => {
    onConfigChange({
      ...config,
      patternSettings: { ...config.patternSettings, ...updates },
    });
  };

  const updateMaterialSettings = (updates: Partial<TextureConfig['materialSettings']>) => {
    onConfigChange({
      ...config,
      materialSettings: { ...config.materialSettings, ...updates },
    });
  };

  const updateJointSettings = (updates: Partial<TextureConfig['jointSettings']>) => {
    onConfigChange({
      ...config,
      jointSettings: { ...config.jointSettings, ...updates },
    });
  };

  const updateAdjustments = (updates: Partial<TextureConfig['adjustments']>) => {
    onConfigChange({
      ...config,
      adjustments: { ...config.adjustments, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Pattern Settings */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Pattern Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rows</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.patternSettings.rows}
                onChange={(e) => updatePatternSettings({ rows: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Columns</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.patternSettings.columns}
                onChange={(e) => updatePatternSettings({ columns: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Width (mm)</label>
              <input
                type="number"
                min="10"
                value={config.patternSettings.width}
                onChange={(e) => updatePatternSettings({ width: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Height (mm)</label>
              <input
                type="number"
                min="10"
                value={config.patternSettings.height}
                onChange={(e) => updatePatternSettings({ height: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Material Settings */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Material Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Width (mm)</label>
              <input
                type="number"
                min="10"
                value={config.materialSettings.width}
                onChange={(e) => updateMaterialSettings({ width: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Height (mm)</label>
              <input
                type="number"
                min="10"
                value={config.materialSettings.height}
                onChange={(e) => updateMaterialSettings({ height: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tint</label>
            <input
              type="color"
              value={config.materialSettings.tint}
              onChange={(e) => updateMaterialSettings({ tint: e.target.value })}
              className="w-full h-10 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Edge Style</label>
            <select
              value={config.materialSettings.edgeStyle}
              onChange={(e) => updateMaterialSettings({ edgeStyle: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="None">None</option>
              <option value="Handmade">Handmade</option>
              <option value="Rough">Rough</option>
              <option value="Grooved">Grooved</option>
              <option value="Voids">Voids</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Tone Variation: {config.materialSettings.toneVariation.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.materialSettings.toneVariation}
              onChange={(e) => updateMaterialSettings({ toneVariation: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Joint Settings */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Joint Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Joint Material</label>
            <input
              type="text"
              value={config.jointSettings.material}
              onChange={(e) => updateJointSettings({ material: e.target.value })}
              placeholder="e.g., Mortar"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Joint Tint</label>
            <input
              type="color"
              value={config.jointSettings.tint}
              onChange={(e) => updateJointSettings({ tint: e.target.value })}
              className="w-full h-10 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Horizontal (mm)</label>
              <input
                type="number"
                min="0"
                value={config.jointSettings.horizontal}
                onChange={(e) => updateJointSettings({ horizontal: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Vertical (mm)</label>
              <input
                type="number"
                min="0"
                value={config.jointSettings.vertical}
                onChange={(e) => updateJointSettings({ vertical: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.jointSettings.recess}
                onChange={(e) => updateJointSettings({ recess: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Recess joints</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.jointSettings.concave}
                onChange={(e) => updateJointSettings({ concave: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Concave joints</span>
            </label>
          </div>
        </div>
      </div>

      {/* Adjustments */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Adjustments</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Brightness: {config.adjustments.brightness.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={config.adjustments.brightness}
              onChange={(e) => updateAdjustments({ brightness: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Contrast: {config.adjustments.contrast.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={config.adjustments.contrast}
              onChange={(e) => updateAdjustments({ contrast: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Hue: {Math.round(config.adjustments.hue)}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={config.adjustments.hue}
              onChange={(e) => updateAdjustments({ hue: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Saturation: {config.adjustments.saturation.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={config.adjustments.saturation}
              onChange={(e) => updateAdjustments({ saturation: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.adjustments.invert}
              onChange={(e) => updateAdjustments({ invert: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Invert Colors</span>
          </label>
        </div>
      </div>
    </div>
  );
}

