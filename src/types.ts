export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ProcessedImage {
  original: File;
  processed?: Blob;
  preview: string;
  dimensions?: {
    width: number;
    height: number;
  };
  size?: number;
  processedSize?: number;
  name?: string;
  type?: string;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

export interface PresetDimension {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'social' | 'document';
}

export const PRESET_DIMENSIONS: PresetDimension[] = [
  // Social Media
  { id: 'instagram-square', name: 'Instagram Square', width: 1080, height: 1080, category: 'social' },
  { id: 'instagram-portrait', name: 'Instagram Portrait', width: 1080, height: 1350, category: 'social' },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { id: 'facebook-cover', name: 'Facebook Cover', width: 1640, height: 624, category: 'social' },
  { id: 'facebook-profile', name: 'Facebook Profile', width: 180, height: 180, category: 'social' },
  { id: 'twitter-header', name: 'Twitter Header', width: 1500, height: 500, category: 'social' },
  { id: 'linkedin-banner', name: 'LinkedIn Banner', width: 1584, height: 396, category: 'social' },
  
  // Documents
  { id: 'passport-us', name: 'US Passport (2x2")', width: 600, height: 600, category: 'document' },
  { id: 'passport-uk', name: 'UK Passport (35x45mm)', width: 450, height: 600, category: 'document' },
  { id: 'visa-photo', name: 'Visa Photo (2x2")', width: 600, height: 600, category: 'document' }
];