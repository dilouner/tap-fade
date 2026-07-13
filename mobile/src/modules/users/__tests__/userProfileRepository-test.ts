/* eslint-disable import/first */
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockCollection = jest.fn((db: unknown, collection: string) => ({ collection, db }));
const mockDoc = jest.fn((db: unknown, collection: string, id: string) => ({ collection, db, id }));

jest.mock('firebase/firestore', () => ({
  collection: (db: unknown, collection: string) => mockCollection(db, collection),
  doc: (db: unknown, collection: string, id: string) => mockDoc(db, collection, id),
  getDoc: (ref: unknown) => mockGetDoc(ref),
  getDocs: (ref: unknown) => mockGetDocs(ref),
  setDoc: (ref: unknown, data: unknown, options?: unknown) => mockSetDoc(ref, data, options),
  updateDoc: (ref: unknown, data: unknown) => mockUpdateDoc(ref, data),
}));

jest.mock('../../../shared/firebase/config', () => ({
  getFirebaseDb: jest.fn(),
}));

import { getOrCreateClientProfile, listUsers, promoteUserToOwner, updateUserRole } from '../userProfileRepository';
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
    mockGetDocs.mockReset();
    mockSetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockCollection.mockClear();
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

  it('promotes a user to owner after creating a barber shop', async () => {
    await promoteUserToOwner('user-2', {} as never);

    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-2');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'owner' }));
  });

  it('lists users for admin operations', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            displayName: 'Admin',
            email: 'admin@example.com',
            phone: null,
            photoURL: null,
            role: 'admin',
            uid: 'admin-1',
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
        },
      ],
    });

    const users = await listUsers({} as never);

    expect(mockCollection).toHaveBeenCalledWith({}, 'users');
    expect(users).toHaveLength(1);
    expect(users[0].role).toBe('admin');
  });

  it('updates user roles from admin tools', async () => {
    await updateUserRole('user-2', 'barber', {} as never);

    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-2');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: 'barber' }));
  });
});
