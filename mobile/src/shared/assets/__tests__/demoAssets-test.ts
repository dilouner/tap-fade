import { profileAvatarKeys, resolveBarberImage, resolveProfileImage, resolveShopImage, shopCoverKeys } from '../demoAssets';

describe('catálogo visual de presentación', () => {
  it('mantiene un catálogo cerrado y completo', () => {
    expect(shopCoverKeys).toHaveLength(4);
    expect(profileAvatarKeys).toHaveLength(8);
    expect(new Set(shopCoverKeys).size).toBe(shopCoverKeys.length);
    expect(new Set(profileAvatarKeys).size).toBe(profileAvatarKeys.length);
  });

  it('prefiere imágenes heredadas y resuelve claves locales', () => {
    expect(resolveShopImage({ coverKey: 'norte', photoUrl: null })).toBeTruthy();
    expect(resolveBarberImage({ avatarKey: 'alex', photoUrl: null })).toBeTruthy();
    expect(resolveProfileImage({ avatarKey: 'sofia', photoURL: null })).toBeTruthy();
    expect(resolveShopImage({ coverKey: 'norte', photoUrl: 'https://example.com/shop.jpg' })).toEqual({ uri: 'https://example.com/shop.jpg' });
  });
});
