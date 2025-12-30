'use client';

import { useState } from 'react';
import { Pattern, PatternCategory } from '@/types/texture';

interface PatternSelectorProps {
  patterns: Pattern[];
  selectedPattern: Pattern | null;
  onSelect: (pattern: Pattern) => void;
  onClose: () => void;
}

export default function PatternSelector({
  patterns,
  selectedPattern,
  onSelect,
  onClose,
}: PatternSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory>('All');

  const categories: PatternCategory[] = ['All', 'Brick Bond', 'Paving', 'Parquetry', 'Geometric', 'Organic', 'Random', 'Roofing'];

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch = pattern.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || pattern.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose Pattern</h2>
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
              onChange={(e) => setSelectedCategory(e.target.value as PatternCategory)}
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
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {filteredPatterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => {
                  onSelect(pattern);
                  onClose();
                }}
                className={`p-3 border-2 rounded-lg hover:border-blue-500 transition-colors ${
                  selectedPattern?.id === pattern.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                title={pattern.name}
              >
                <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center mb-2 relative overflow-hidden">
                  {pattern.svgUrl ? (
                    <img
                      src={pattern.svgUrl}
                      alt={pattern.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-xs text-gray-400">None</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>
                <p className="text-xs text-center text-gray-700 truncate">{pattern.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

