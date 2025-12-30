export interface Pattern {
  id: string;
  name: string;
  category: PatternCategory;
  svgUrl: string;
  defaultRows?: number;
  defaultColumns?: number;
}

export type PatternCategory = 
  | 'All'
  | 'Brick Bond'
  | 'Paving'
  | 'Parquetry'
  | 'Geometric'
  | 'Organic'
  | 'Random'
  | 'Roofing';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  imageUrl: string;
  thumbnailUrl?: string;
}

export type MaterialCategory =
  | 'Stone'
  | 'Brick'
  | 'Wood'
  | 'Terrazzo'
  | 'Concrete'
  | 'Metal'
  | 'Tile'
  | 'Fabric'
  | 'Wallpaper'
  | 'Carpet'
  | 'Surfaces'
  | 'Finishes'
  | 'Landscaping'
  | 'Insulation'
  | 'Organic'
  | 'Acoustic';

export interface TextureConfig {
  pattern: Pattern | null;
  material: Material | null;
  patternSettings: PatternSettings;
  materialSettings: MaterialSettings;
  jointSettings: JointSettings;
  adjustments: Adjustments;
}

export interface PatternSettings {
  rows: number;
  columns: number;
  width: number; // in mm
  height: number; // in mm
  angle?: number;
}

export interface MaterialSettings {
  width: number; // in mm
  height: number; // in mm
  tint: string; // hex color
  edgeStyle: EdgeStyle;
  profile?: string;
  finish?: string;
  toneVariation: number; // 0-1
}

export type EdgeStyle = 'None' | 'Handmade' | 'Rough' | 'Grooved' | 'Voids';

export interface JointSettings {
  material: string;
  tint: string; // hex color
  horizontal: number; // in mm
  vertical: number; // in mm
  recess: boolean;
  concave: boolean;
}

export interface Adjustments {
  brightness: number; // 0-2, default 1
  contrast: number; // 0-2, default 1
  hue: number; // 0-360, default 0
  saturation: number; // 0-2, default 1
  invert: boolean;
}

