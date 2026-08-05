/* eslint-disable import/first */
const mockCollection = jest.fn((...path: unknown[]) => ({ path }));
const mockDoc = jest.fn((...path: unknown[]) => ({ id: path.length === 1 ? 'appointment-new' : String(path[path.length - 1]), path }));
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn(async (ref: { path: unknown[] }) => {
  if (ref.path.includes('services')) return { exists: () => true, data: () => ({ active: true, durationMinutes: 45, price: 250 }) };
  if (ref.path.includes('barbers')) return { exists: () => true, data: () => ({ active: true, serviceIds: ['service-1'] }) };
  return { exists: () => true, data: () => ({ status: 'active' }) };
});
const mockTransactionSet = jest.fn();
let occupied = false;

const mockTransaction = {
  delete: jest.fn(),
  get: jest.fn(async (ref: { path: unknown[] }) => {
    if (ref.path.includes('appointmentSlots')) return { exists: () => occupied, data: () => ({}) };
    if (ref.path.includes('barbers')) return { exists: () => true, data: () => ({ userId: 'barber-user' }) };
    return { exists: () => true, data: () => ({ ownerId: 'owner-1' }) };
  }),
  set: (...args: unknown[]) => mockTransactionSet(...args),
  update: jest.fn(),
};

jest.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => mockCollection(...path),
  doc: (...path: unknown[]) => mockDoc(...path),
  getDocs: (queryRef: unknown) => mockGetDocs(queryRef),
  getDoc: (ref: unknown) => mockGetDoc(ref as { path: unknown[] }),
  query: (collectionRef: unknown, ...filters: unknown[]) => ({ collectionRef, filters }),
  limit: (value: number) => ({ limit: value }),
  runTransaction: async (_db: unknown, handler: (value: typeof mockTransaction) => Promise<unknown>) => handler(mockTransaction),
  where: (field: string, operator: string, value: unknown) => ({ field, operator, value }),
}));

jest.mock('../../../shared/firebase/config', () => ({ getFirebaseDb: jest.fn() }));

import { buildSlotIds, createClientAppointment, listAllAppointments } from '../appointmentRepository';

function appointmentInput() {
  const startAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  startAt.setHours(12, 0, 0, 0);
  return {
    barberId: 'barber-1', barberName: 'Daniel', barberShopId: 'shop-1', clientId: 'client-1', clientName: 'Cliente',
    durationSnapshot: 45, priceSnapshot: 250, serviceId: 'service-1', serviceName: 'Corte',
    startAt,
  };
}

describe('appointmentRepository', () => {
  beforeEach(() => {
    occupied = false;
    mockCollection.mockClear(); mockDoc.mockClear(); mockGetDocs.mockReset(); mockTransactionSet.mockReset();
    mockGetDocs.mockResolvedValue({ docs: [{ data: () => ({ barberId: 'barber-1', barberShopId: 'shop-1', blocked: false, createdAt: new Date(), date: null, dayOfWeek: appointmentInput().startAt.getDay(), endTime: '18:00', id: 'availability-1', kind: 'weekly', reason: null, startTime: '09:00', updatedAt: new Date() }) }] });
    mockTransaction.get.mockClear(); mockTransaction.delete.mockClear(); mockTransaction.update.mockClear();
  });

  it('locks every 15-minute segment while creating a pending appointment', async () => {
    const appointment = await createClientAppointment(appointmentInput(), {} as never);
    expect(appointment.status).toBe('pending');
    expect(buildSlotIds('shop-1', 'barber-1', appointment.startAt, 45)).toHaveLength(3);
    expect(mockTransactionSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ barberId: 'barber-1' }));
  });

  it('rejects a concurrent appointment when one segment is occupied', async () => {
    occupied = true;
    await expect(createClientAppointment(appointmentInput(), {} as never)).rejects.toThrow('Ese horario acaba de ocuparse');
  });

  it('lists all appointments for admin monitoring', async () => {
    const input = appointmentInput();
    mockGetDocs.mockResolvedValue({ docs: [{ data: () => ({ ...input, createdAt: new Date(), endAt: new Date(input.startAt.getTime() + 45 * 60_000), id: 'appointment-1', rescheduleRequest: null, revision: 1, status: 'pending', updatedAt: new Date() }) }] });
    const appointments = await listAllAppointments({} as never);
    expect(mockCollection).toHaveBeenCalledWith({}, 'appointments');
    expect(appointments[0].status).toBe('pending');
  });
});
