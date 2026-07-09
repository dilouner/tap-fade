import { createBarberService, isValidService } from '../serviceCatalog';

describe('service catalog domain', () => {
  it('accepts service duration in 15 minute slots', () => {
    const service = createBarberService({
      barberShopId: 'shop-1',
      durationMinutes: 45,
      name: ' Corte + barba ',
      price: 250,
    }, 'service-1');

    expect(service).toMatchObject({
      active: true,
      durationMinutes: 45,
      name: 'Corte + barba',
      price: 250,
    });
    expect(isValidService(service)).toBe(true);
  });

  it('rejects durations outside the 15 minute grid', () => {
    expect(isValidService({
      barberShopId: 'shop-1',
      durationMinutes: 20,
      name: 'Corte',
      price: 100,
    })).toBe(false);
  });
});
