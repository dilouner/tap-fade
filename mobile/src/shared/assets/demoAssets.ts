import type { ImageSource } from 'expo-image';

import type { Barber, BarberShop } from '../../modules/barber-shops/types';
import type { UserProfile } from '../../modules/users/types';

export const shopCovers = {
  norte: require('../../../assets/demo/shop-norte.webp'),
  distrito: require('../../../assets/demo/shop-distrito.webp'),
  nomada: require('../../../assets/demo/shop-nomada.webp'),
  bronce: require('../../../assets/demo/shop-bronce.webp'),
} as const;

export const profileAvatars = {
  mateo: require('../../../assets/demo/avatar-mateo.webp'),
  alex: require('../../../assets/demo/avatar-alex.webp'),
  diego: require('../../../assets/demo/avatar-diego.webp'),
  valeria: require('../../../assets/demo/avatar-valeria.webp'),
  juan: require('../../../assets/demo/avatar-juan.webp'),
  emiliano: require('../../../assets/demo/avatar-emiliano.webp'),
  bruno: require('../../../assets/demo/avatar-bruno.webp'),
  sofia: require('../../../assets/demo/avatar-sofia.webp'),
} as const;

export type ShopCoverKey = keyof typeof shopCovers;
export type ProfileAvatarKey = keyof typeof profileAvatars;
export const shopCoverKeys = Object.keys(shopCovers) as ShopCoverKey[];
export const profileAvatarKeys = Object.keys(profileAvatars) as ProfileAvatarKey[];

const shopFallback = require('../../../assets/brand-digital-applications.png');
const avatarFallback = require('../../../assets/logo-symbol-color.png');

export function resolveShopImage(shop?: Pick<BarberShop, 'coverKey' | 'photoUrl'> | null): ImageSource {
  if (shop?.photoUrl) return { uri: shop.photoUrl };
  return shop?.coverKey && shop.coverKey in shopCovers ? shopCovers[shop.coverKey as ShopCoverKey] : shopFallback;
}

export function resolveBarberImage(barber?: Pick<Barber, 'avatarKey' | 'photoUrl'> | null): ImageSource {
  if (barber?.photoUrl) return { uri: barber.photoUrl };
  return barber?.avatarKey && barber.avatarKey in profileAvatars ? profileAvatars[barber.avatarKey as ProfileAvatarKey] : avatarFallback;
}

export function resolveProfileImage(profile?: Pick<UserProfile, 'avatarKey' | 'photoURL'> | null): ImageSource {
  if (profile?.photoURL) return { uri: profile.photoURL };
  return profile?.avatarKey && profile.avatarKey in profileAvatars ? profileAvatars[profile.avatarKey as ProfileAvatarKey] : avatarFallback;
}
