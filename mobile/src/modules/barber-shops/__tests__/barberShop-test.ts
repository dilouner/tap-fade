import { createBarber, createBarberShop, isValidBarber, isValidBarberShop } from '../barberShop';

describe('barber shop domain', () => {
  it('creates an active shop for the authenticated owner', () => {
    const shop = createBarberShop({
      address: 'Centro 123',
      description: 'Fades y barba',
      name: ' TapFade Studio ',
      ownerId: 'owner-1',
      photoUrl: ' https://example.com/shop.jpg ',
    }, 'shop-1');

    expect(shop).toMatchObject({
      id: 'shop-1',
      name: 'TapFade Studio',
      ownerId: 'owner-1',
      photoUrl: 'https://example.com/shop.jpg',
      status: 'active',
    });
    expect(isValidBarberShop(shop)).toBe(true);
  });

  it('creates an internal barber with normalized specialties', () => {
    const barber = createBarber({
      barberShopId: 'shop-1',
      displayName: ' Daniel ',
      photoUrl: '',
      specialties: [' fade ', '', 'barba'],
    }, 'barber-1');

    expect(barber).toMatchObject({
      active: true,
      displayName: 'Daniel',
      photoUrl: null,
      specialties: ['fade', 'barba'],
      userId: null,
    });
    expect(isValidBarber(barber)).toBe(true);
  });
});
