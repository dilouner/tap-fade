/* eslint-disable import/first */
const mockCollection = jest.fn((...path: unknown[]) => ({ path }));
const mockDoc = jest.fn((collectionRef: unknown) => ({ collectionRef, id: 'appointment-new' }));
const mockGetDocs = jest.fn();
const mockQuery = jest.fn((collectionRef: unknown, filter: unknown) => ({ collectionRef, filter }));
const mockSetDoc = jest.fn();
const mockWhere = jest.fn((field: string, operator: string, value: unknown) => ({ field, operator, value }));

jest.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => mockCollection(...path),
  doc: (collectionRef: unknown) => mockDoc(collectionRef),
  getDocs: (queryRef: unknown) => mockGetDocs(queryRef),
  query: (collectionRef: unknown, filter: unknown) => mockQuery(collectionRef, filter),
  setDoc: (ref: unknown, data: unknown) => mockSetDoc(ref, data),
  updateDoc: jest.fn(),
  where: (field: string, operator: string, value: unknown) => mockWhere(field, operator, value),
}));

jest.mock('../../../shared/firebase/config', () => ({
  getFirebaseDb: jest.fn(),
}));

import { createClientAppointment, listAllAppointments } from '../appointmentRepository';

const input = {
  barberId: 'barber-1',
  barberName: 'Daniel',
  barberShopId: 'shop-1',
  clientId: 'client-1',
  clientName: 'Cliente',
  durationSnapshot: 45,
  priceSnapshot: 250,
  serviceId: 'service-1',
  serviceName: 'Corte',
  startAt: new Date('2026-07-10T10:00:00.000Z'),
};

describe('appointmentRepository', () => {
  beforeEach(() => {
    mockCollection.mockClear();
    mockDoc.mockClear();
    mockGetDocs.mockReset();
    mockQuery.mockClear();
    mockSetDoc.mockReset();
    mockWhere.mockClear();
  });

  it('creates a pending appointment when there is no active conflict', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const appointment = await createClientAppointment(input, {} as never);

    expect(appointment.status).toBe('pending');
    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ barberId: 'barber-1' }));
  });

  it('rejects a new appointment when the barber is already busy', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            ...input,
            createdAt: new Date('2026-07-01T00:00:00.000Z'),
            endAt: new Date('2026-07-10T10:45:00.000Z'),
            id: 'appointment-existing',
            status: 'confirmed',
            updatedAt: new Date('2026-07-01T00:00:00.000Z'),
          }),
        },
      ],
    });

    await expect(createClientAppointment(input, {} as never)).rejects.toThrow('barbero ya tiene una cita activa');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('lists all appointments for admin monitoring', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            ...input,
            createdAt: new Date('2026-07-01T00:00:00.000Z'),
            endAt: new Date('2026-07-10T10:45:00.000Z'),
            id: 'appointment-1',
            status: 'pending',
            updatedAt: new Date('2026-07-01T00:00:00.000Z'),
          }),
        },
      ],
    });

    const appointments = await listAllAppointments({} as never);

    expect(mockCollection).toHaveBeenCalledWith({}, 'appointments');
    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toBe('pending');
  });
});
