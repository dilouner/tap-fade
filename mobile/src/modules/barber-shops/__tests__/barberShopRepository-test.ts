/* eslint-disable import/first */
const mockCollection = jest.fn((...path: unknown[]) => ({ path }));
const mockDoc = jest.fn((...path: unknown[]) => ({ path }));
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => mockCollection(...path),
  doc: (...path: unknown[]) => mockDoc(...path),
  getDocs: (ref: unknown) => mockGetDocs(ref),
  limit: jest.fn(),
  query: jest.fn((collectionRef: unknown) => collectionRef),
  setDoc: jest.fn(),
  updateDoc: (ref: unknown, data: unknown) => mockUpdateDoc(ref, data),
  where: jest.fn(),
}));

jest.mock('../../../shared/firebase/config', () => ({
  getFirebaseDb: jest.fn(),
}));

jest.mock('../../users/userProfileRepository', () => ({
  promoteUserToOwner: jest.fn(),
}));

import { assignUserToBarber, listAllBarberShops, updateBarberShopStatus } from '../barberShopRepository';

describe('barberShopRepository admin operations', () => {
  beforeEach(() => {
    mockCollection.mockClear();
    mockDoc.mockClear();
    mockGetDocs.mockReset();
    mockUpdateDoc.mockReset();
  });

  it('lists all barber shops for admin review', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            address: 'Centro 123',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            description: 'Fades',
            id: 'shop-1',
            name: 'TapFade Studio',
            ownerId: 'owner-1',
            photoUrl: null,
            status: 'inactive',
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
        },
      ],
    });

    const shops = await listAllBarberShops({} as never);

    expect(mockCollection).toHaveBeenCalledWith({}, 'barberShops');
    expect(shops[0].status).toBe('inactive');
  });

  it('updates barber shop status', async () => {
    await updateBarberShopStatus('shop-1', 'inactive', {} as never);

    expect(mockDoc).toHaveBeenCalledWith({}, 'barberShops', 'shop-1');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'inactive' }));
  });

  it('assigns a user to a barber record', async () => {
    await assignUserToBarber('shop-1', 'barber-1', ' user-1 ', {} as never);

    expect(mockDoc).toHaveBeenCalledWith({}, 'barberShops', 'shop-1', 'barbers', 'barber-1');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: 'user-1' }));
  });
});
