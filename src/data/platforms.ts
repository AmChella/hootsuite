import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Platform {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  maxChars: number;
  supportsVideo: boolean;
  supportsImage: boolean;
  supportsMultipleImages: boolean;
}

export const platforms: Platform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: '#1da1f2',
    maxChars: 280,
    supportsVideo: true,
    supportsImage: true,
    supportsMultipleImages: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: '#1877f2',
    maxChars: 63206,
    supportsVideo: true,
    supportsImage: true,
    supportsMultipleImages: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: '#e4405f',
    maxChars: 2200,
    supportsVideo: true,
    supportsImage: true,
    supportsMultipleImages: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0a66c2',
    maxChars: 3000,
    supportsVideo: true,
    supportsImage: true,
    supportsMultipleImages: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: '#ff0000',
    maxChars: 5000,
    supportsVideo: true,
    supportsImage: false,
    supportsMultipleImages: false,
  },
];

export function getPlatformById(id: string): Platform | undefined {
  return platforms.find((p) => p.id === id);
}

export function getPlatformColor(id: string): string {
  return getPlatformById(id)?.color || '#6366f1';
}
