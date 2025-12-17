import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Colors } from './Colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Platform {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  description: string;
}

export const platforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: Colors.platforms.facebook,
    description: 'Share to your Facebook page or profile',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: Colors.platforms.instagram,
    description: 'Post photos and reels to Instagram',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'logo-twitter',
    color: Colors.platforms.twitter,
    description: 'Tweet to your followers',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: Colors.platforms.linkedin,
    description: 'Share professional updates',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    color: Colors.platforms.youtube,
    description: 'Upload videos to your channel',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'logo-tiktok',
    color: Colors.platforms.tiktok,
    description: 'Share short-form videos',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'logo-pinterest',
    color: Colors.platforms.pinterest,
    description: 'Pin images to your boards',
  },
];

export function getPlatformById(id: string): Platform | undefined {
  return platforms.find(p => p.id === id);
}
