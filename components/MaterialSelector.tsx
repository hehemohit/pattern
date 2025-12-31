'use client';

import { useState } from 'react';
import { Material, MaterialCategory } from '@/types/texture';
import Image from 'next/image';

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterial: Material | null;
  onSelect: (material: Material) => void;
  onClose: () => void;
  onAddCustom?: (material: Material) => void;
}

export default function MaterialSelector({
  materials,
  selectedMaterial,
  onSelect,
  onClose,
  onAddCustom,
}: MaterialSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'All'>('All');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MaterialCategory>('Stone');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) {
      alert('Please select an image file');
      return;
    }

    if (!uploadName.trim()) {
      alert('Please enter a name for the material');
      return;
    }

    if (!previewUrl) {
      alert('Please wait for the image to load');
      return;
    }

    // Create thumbnail
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create thumbnail (200x200)
      const maxSize = 200;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

      const newMaterial: Material = {
        id: `custom-${Date.now()}`,
        name: uploadName.trim(),
        category: uploadCategory,
        imageUrl: previewUrl,
        thumbnailUrl: thumbnailUrl,
      };

      if (onAddCustom) {
        onAddCustom(newMaterial);
      }

      // Reset form
      setUploadName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowUpload(false);
    };
    img.src = previewUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose Material</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {showUpload ? 'Cancel' : '+ Upload'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {showUpload && (
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-sm font-semibold mb-3">Upload Custom Material</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Material name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {categories.filter(cat => cat !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border rounded-md"
              />
              {previewUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">Preview:</p>
                  <div className="w-32 h-32 border rounded-md overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || !uploadName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Upload Material
              </button>
            </div>
          </div>
        )}

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

