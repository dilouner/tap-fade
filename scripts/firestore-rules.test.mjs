import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'tapfade-dev',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => environment?.cleanup());
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await Promise.all([
      setDoc(doc(firestore, 'users', 'admin-1'), profile('admin-1', ['client', 'admin'])),
      setDoc(doc(firestore, 'users', 'client-1'), profile('client-1', ['client'])),
      setDoc(doc(firestore, 'users', 'client-2'), profile('client-2', ['client'])),
      setDoc(doc(firestore, 'barberShops', 'shop-active'), shop('shop-active', 'owner-1', 'active')),
      setDoc(doc(firestore, 'barberShops', 'shop-paused'), shop('shop-paused', 'owner-1', 'paused')),
      setDoc(doc(firestore, 'barberShops', 'shop-suspended'), shop('shop-suspended', 'owner-1', 'suspended')),
      setDoc(doc(firestore, 'barberShops', 'shop-active', 'barbers', 'barber-1'), { active: true, barberShopId: 'shop-active', displayName: 'Alex', id: 'barber-1', serviceIds: ['service-1'], userId: 'barber-user' }),
      setDoc(doc(firestore, 'barberShops', 'shop-active', 'services', 'service-1'), { active: true, barberShopId: 'shop-active', durationMinutes: 30, id: 'service-1', name: 'Corte', price: 250 }),
      setDoc(doc(firestore, 'barberShops', 'shop-active', 'availability', 'monday'), { barberId: 'barber-1', barberShopId: 'shop-active', blocked: false, dayOfWeek: 1, endTime: '18:00', id: 'monday', kind: 'weekly', startTime: '09:00' }),
    ]);
  });
});

test('visitantes solo consultan el escaparate activo', async () => {
  const db = environment.unauthenticatedContext().firestore();
  const result = await assertSucceeds(getDocs(query(collection(db, 'barberShops'), where('status', '==', 'active'))));
  assert.equal(result.size, 1);
  await assertFails(getDoc(doc(db, 'barberShops', 'shop-paused')));
  await assertFails(getDoc(doc(db, 'barberShops', 'shop-active', 'availability', 'monday')));
});

test('un cliente no puede elevarse a administrador', async () => {
  const db = environment.authenticatedContext('client-1').firestore();
  await assertFails(updateDoc(doc(db, 'users', 'client-1'), { role: 'admin', roles: ['client', 'admin'] }));
});

test('un administrador puede suspender y auditar un negocio', async () => {
  const db = environment.authenticatedContext('admin-1').firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'adminAudit', 'audit-1'), { action: 'update_shop_status', actorId: 'admin-1', createdAt: new Date(), detail: 'suspended', id: 'audit-1', targetId: 'shop-active' });
  batch.update(doc(db, 'barberShops', 'shop-active'), { lastAuditId: 'audit-1', status: 'suspended', updatedAt: new Date() });
  await assertSucceeds(batch.commit());
});

test('un barbero legado asignado puede administrar sólo su disponibilidad', async () => {
  const barberDb = environment.authenticatedContext('barber-user').firestore();
  const block = { barberId: 'barber-1', barberShopId: 'shop-active', blocked: false, createdAt: new Date(), date: null, dayOfWeek: 2, endTime: '18:00', id: 'legacy-block', kind: 'weekly', reason: null, startTime: '09:00', updatedAt: new Date() };
  await assertSucceeds(setDoc(doc(barberDb, 'barberShops', 'shop-active', 'availability', block.id), block));
  const unrelatedDb = environment.authenticatedContext('client-2').firestore();
  await assertFails(setDoc(doc(unrelatedDb, 'barberShops', 'shop-active', 'availability', 'forbidden'), { ...block, id: 'forbidden' }));
});

test('los bloqueos impiden escribir dos reservas sobre el mismo segmento', async () => {
  const first = environment.authenticatedContext('client-1').firestore();
  const appointment = appointmentData('appointment-1', 'client-1');
  const batch = writeBatch(first);
  batch.set(doc(first, 'appointments', appointment.id), appointment);
  batch.set(doc(first, 'appointmentSlots', appointment.slotIds[0]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: appointment.startAt });
  batch.set(doc(first, 'appointmentSlots', appointment.slotIds[1]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: new Date(appointment.startAt.getTime() + 900_000) });
  await assertSucceeds(batch.commit());

  const second = environment.authenticatedContext('client-2').firestore();
  await assertFails(setDoc(doc(second, 'appointmentSlots', 'barber-1_202608101000'), { appointmentId: 'appointment-2', barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-2', purpose: 'appointment', slotAt: appointment.startAt }));
});

test('una reserva incompleta no puede omitir segmentos', async () => {
  const db = environment.authenticatedContext('client-1').firestore();
  const appointment = appointmentData('appointment-incomplete', 'client-1');
  const batch = writeBatch(db);
  batch.set(doc(db, 'appointments', appointment.id), appointment);
  batch.set(doc(db, 'appointmentSlots', appointment.slotIds[0]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: appointment.startAt });
  await assertFails(batch.commit());
});

test('el cliente no puede mover directamente una cita ni liberar su bloqueo activo', async () => {
  const db = environment.authenticatedContext('client-1').firestore();
  const appointment = appointmentData('appointment-protected', 'client-1');
  const batch = writeBatch(db);
  batch.set(doc(db, 'appointments', appointment.id), appointment);
  batch.set(doc(db, 'appointmentSlots', appointment.slotIds[0]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: appointment.startAt });
  batch.set(doc(db, 'appointmentSlots', appointment.slotIds[1]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: new Date(appointment.startAt.getTime() + 900_000) });
  await assertSucceeds(batch.commit());
  await assertFails(updateDoc(doc(db, 'appointments', appointment.id), { startAt: new Date(appointment.startAt.getTime() + 3_600_000), endAt: new Date(appointment.endAt.getTime() + 3_600_000), revision: 2, updatedAt: new Date() }));
  await assertFails(deleteDoc(doc(db, 'appointmentSlots', appointment.slotIds[0])));
});

test('un dueño no puede restaurar un negocio suspendido', async () => {
  const db = environment.authenticatedContext('owner-1').firestore();
  await assertFails(updateDoc(doc(db, 'barberShops', 'shop-suspended'), { status: 'active', updatedAt: new Date() }));
});

test('un administrador no puede mutar sin auditoría atómica', async () => {
  const db = environment.authenticatedContext('admin-1').firestore();
  await assertFails(updateDoc(doc(db, 'barberShops', 'shop-active'), { status: 'suspended', updatedAt: new Date() }));
});

test('una cancelación válida cambia estado y libera todos los segmentos', async () => {
  const db = environment.authenticatedContext('client-1').firestore();
  const appointment = appointmentData('appointment-cancel', 'client-1');
  const create = writeBatch(db);
  create.set(doc(db, 'appointments', appointment.id), appointment);
  create.set(doc(db, 'appointmentSlots', appointment.slotIds[0]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: appointment.startAt });
  create.set(doc(db, 'appointmentSlots', appointment.slotIds[1]), { appointmentId: appointment.id, barberId: 'barber-1', barberShopId: 'shop-active', clientId: 'client-1', purpose: 'appointment', slotAt: new Date(appointment.startAt.getTime() + 900_000) });
  await assertSucceeds(create.commit());
  const cancel = writeBatch(db);
  cancel.update(doc(db, 'appointments', appointment.id), { rescheduleRequest: null, revision: 2, status: 'cancelled', updatedAt: new Date() });
  cancel.delete(doc(db, 'appointmentSlots', appointment.slotIds[0]));
  cancel.delete(doc(db, 'appointmentSlots', appointment.slotIds[1]));
  await assertSucceeds(cancel.commit());
});

function profile(uid, roles) { return { createdAt: new Date(), displayName: uid, email: `${uid}@example.com`, phone: null, photoURL: null, role: roles.at(-1), roles, uid, updatedAt: new Date() }; }
function shop(id, ownerId, status) { return { address: 'Centro', createdAt: new Date(), description: 'Barbería', id, location: null, name: id, ownerId, photoUrl: null, status, timezone: 'America/Chihuahua', updatedAt: new Date() }; }
function appointmentData(id, clientId) { const startAt = new Date('2026-08-10T16:00:00.000Z'); return { barberId: 'barber-1', barberName: 'Alex', barberShopId: 'shop-active', clientId, clientName: clientId, createdAt: new Date(), durationSnapshot: 30, endAt: new Date(startAt.getTime() + 1_800_000), id, priceSnapshot: 250, rescheduleRequest: null, revision: 1, serviceId: 'service-1', serviceName: 'Corte', slotIds: ['shop-active_barber-1_202608101600', 'shop-active_barber-1_202608101615'], startAt, status: 'pending', updatedAt: new Date() }; }
