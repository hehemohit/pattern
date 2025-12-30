import { Material } from '@/types/texture';

// Using placeholder images with seeded IDs for consistent images
// Using picsum.photos with seed parameter for consistent images per material
const PLACEHOLDER_BASE = 'https://picsum.photos/seed';

export const materials: Material[] = [
  // Stone
  {
    id: 'granite-1',
    name: 'Granite',
    category: 'Stone',
    imageUrl: `${PLACEHOLDER_BASE}/granite-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/granite-1/200/200`,
  },
  {
    id: 'limestone-1',
    name: 'Limestone',
    category: 'Stone',
    imageUrl: `${PLACEHOLDER_BASE}/limestone-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/limestone-1/200/200`,
  },
  {
    id: 'marble-1',
    name: 'White Marble',
    category: 'Stone',
    imageUrl: `${PLACEHOLDER_BASE}/marble-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/marble-1/200/200`,
  },
  {
    id: 'slate-1',
    name: 'Slate',
    category: 'Stone',
    imageUrl: `${PLACEHOLDER_BASE}/slate-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/slate-1/200/200`,
  },
  {
    id: 'travertine-1',
    name: 'Travertine',
    category: 'Stone',
    imageUrl: `${PLACEHOLDER_BASE}/travertine-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/travertine-1/200/200`,
  },
  // Brick
  {
    id: 'brick-red-1',
    name: 'Red Brick',
    category: 'Brick',
    imageUrl: `${PLACEHOLDER_BASE}/brick-red-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/brick-red-1/200/200`,
  },
  {
    id: 'brick-white-1',
    name: 'White Brick',
    category: 'Brick',
    imageUrl: `${PLACEHOLDER_BASE}/brick-white-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/brick-white-1/200/200`,
  },
  // Wood
  {
    id: 'wood-oak-1',
    name: 'Oak',
    category: 'Wood',
    imageUrl: `${PLACEHOLDER_BASE}/wood-oak-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/wood-oak-1/200/200`,
  },
  {
    id: 'wood-walnut-1',
    name: 'Walnut',
    category: 'Wood',
    imageUrl: `${PLACEHOLDER_BASE}/wood-walnut-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/wood-walnut-1/200/200`,
  },
  // Concrete
  {
    id: 'concrete-1',
    name: 'Concrete',
    category: 'Concrete',
    imageUrl: `${PLACEHOLDER_BASE}/concrete-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/concrete-1/200/200`,
  },
  {
    id: 'concrete-2',
    name: 'Polished Concrete',
    category: 'Concrete',
    imageUrl: `${PLACEHOLDER_BASE}/concrete-2/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/concrete-2/200/200`,
  },
  // Tile
  {
    id: 'tile-ceramic-1',
    name: 'Ceramic Tile',
    category: 'Tile',
    imageUrl: `${PLACEHOLDER_BASE}/tile-ceramic-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/tile-ceramic-1/200/200`,
  },
  {
    id: 'tile-mosaic-1',
    name: 'Mosaic Tile',
    category: 'Tile',
    imageUrl: `${PLACEHOLDER_BASE}/tile-mosaic-1/800/800`,
    thumbnailUrl: `${PLACEHOLDER_BASE}/tile-mosaic-1/200/200`,
  },
];
