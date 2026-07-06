/* eslint-disable import/first */
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn((db: unknown, collection: string, id: string) => ({ collection, db, id }));

jest.mock('firebase/firestore', () => ({
  doc: (db: unknown, collection: string, id: string) => mockDoc(db, collection, id),
  getDoc: (ref: unknown) => mockGetDoc(ref),
  setDoc: (ref: unknown, data: unknown, options?: unknown) => mockSetDoc(ref, data, options),
}));

jest.mock('../../../shared/firebase/config', () => ({
  getFirebaseDb: jest.fn(),
}));

import { getOrCreateClientProfile } from '../userProfileRepository';
import type { AuthenticatedUser } from '../types';

const user: AuthenticatedUser = {
  displayName: 'Brandom Borrego',
  email: 'brandom@example.com',
  phoneNumber: null,
  photoURL: null,
  uid: 'user-2',
};

describe('userProfileRepository', () => {
  beforeEach(() => {
    mockGetDoc.mockReset();
    mockSetDoc.mockReset();
    mockDoc.mockClear();
  });

  it('creates a client profile when the user document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const profile = await getOrCreateClientProfile(user, {} as never);

    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-2');
    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'client', uid: 'user-2' }), undefined);
    expect(profile.role).toBe('client');
  });

  it('updates profile metadata while preserving an existing role', async () => {
    mockGetDoc.mockResolvedValue({
      data: () => ({
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        displayName: 'Old Name',
        email: 'old@example.com',
        phone: null,
        photoURL: null,
        role: 'barber',
        uid: 'user-2',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      exists: () => true,
    });

    const profile = await getOrCreateClientProfile(user, {} as never);

    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'barber' }), { merge: true });
    expect(profile.role).toBe('barber');
    expect(profile.displayName).toBe('Brandom Borrego');
  });
});
