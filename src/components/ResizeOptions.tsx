import React from 'react';
import { ResizeOptions, PresetDimension, PRESET_DIMENSIONS } from '../types';
import { Link } from 'lucide-react';

interface ResizeOptionsPanelProps {
  options: ResizeOptions;
  onChange: (options: ResizeOptions) => void;
  originalDimensions?: { width: number; height: number };
}

export const ResizeOptionsPanel: React.FC<ResizeOptionsPanelProps> = ({
  options,
  onChange,
  originalDimensions
}) => {
  const handleWidthChange = (width: number) => {
    if (options.maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      const height = Math.round(width / aspectRatio);
      onChange({ ...options, width, height });
    } else {
      onChange({ ...options, width });
    }
  };

  const handleHeightChange = (height: number) => {
    if (options.maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      const width = Math.round(height * aspectRatio);
      onChange({ ...options, width, height });
    } else {
      onChange({ ...options, height });
    }
  };

  const handlePresetChange = (preset: PresetDimension | null) => {
    if (preset) {
      onChange({
        ...options,
        width: preset.width,
        height: preset.height,
        maintainAspectRatio: true
      });
    }
  };

  // Group presets by category
  const groupedPresets = PRESET_DIMENSIONS.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, PresetDimension[]>);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Preset Dimensions</label>
        <select
          onChange={(e) => {
            const preset = PRESET_DIMENSIONS.find(p => p.id === e.target.value);
            handlePresetChange(preset || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue=""
        >
          <option value="">Custom Size</option>
          {Object.entries(groupedPresets).map(([category, presets]) => (
            <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.width}×{preset.height})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
          <input
            type="number"
            value={options.width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
          <input
            type="number"
            value={options.height}
            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="maintainAspectRatio"
          checked={options.maintainAspectRatio}
          onChange={(e) => onChange({ ...options, maintainAspectRatio: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="maintainAspectRatio" className="text-sm text-gray-700 flex items-center">
          <Link className="w-4 h-4 mr-1" />
          Maintain aspect ratio
        </label>
      </div>

      {originalDimensions && (
        <p className="text-sm text-gray-500">
          Original dimensions: {originalDimensions.width} × {originalDimensions.height} px
        </p>
      )}
    </div>
  );
};