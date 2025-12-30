'use client';

import { useState } from 'react';
import { Material, MaterialCategory } from '@/types/texture';
import Image from 'next/image';

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterial: Material | null;
  onSelect: (material: Material) => void;
  onClose: () => void;
}

export default function MaterialSelector({
  materials,
  selectedMaterial,
  onSelect,
  onClose,
}: MaterialSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'All'>('All');

  const categories: (MaterialCategory | 'All')[] = [
    'All',
    'Stone',
    'Brick',
    'Wood',
    'Terrazzo',
    'Concrete',
    'Metal',
    'Tile',
    'Fabric',
    'Wallpaper',
    'Carpet',
    'Surfaces',
    'Finishes',
    'Landscaping',
    'Insulation',
    'Organic',
    'Acoustic',
  ];

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedMaterials = filteredMaterials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<MaterialCategory, Material[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose Material</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-4 mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory | 'All')}
              className="px-3 py-2 border rounded-md"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedCategory === 'All' ? (
            Object.entries(groupedMaterials).map(([category, mats]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{category}</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {mats.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => {
                        onSelect(material);
                        onClose();
                      }}
                      className={`p-2 border-2 rounded-lg hover:border-blue-500 transition-colors ${
                        selectedMaterial?.id === material.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      title={material.name}
                    >
                      <div className="w-full h-20 bg-gray-100 rounded mb-2 relative overflow-hidden">
                        <Image
                          src={material.thumbnailUrl || material.imageUrl}
                          alt={material.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <p className="text-xs text-center text-gray-700 truncate">{material.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => {
                    onSelect(material);
                    onClose();
                  }}
                  className={`p-2 border-2 rounded-lg hover:border-blue-500 transition-colors ${
                    selectedMaterial?.id === material.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  title={material.name}
                >
                  <div className="w-full h-20 bg-gray-100 rounded mb-2 relative overflow-hidden">
                    <Image
                      src={material.thumbnailUrl || material.imageUrl}
                      alt={material.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="text-xs text-center text-gray-700 truncate">{material.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

