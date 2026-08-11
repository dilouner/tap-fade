import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const projectId = value('--project=') || 'tapfade-dev';
const apply = process.argv.includes('--apply');
const restorePath = value('--restore=');
if ((apply || restorePath) && value('--confirm=') !== projectId) {
  throw new Error(`Para modificar datos agrega --confirm=${projectId}`);
}

let temporaryCredentialPath;
const cliConfig = JSON.parse(await readFile(join(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json'), 'utf8'));
if (cliConfig.tokens?.refresh_token && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const clientId = process.env.FIREBASE_CLIENT_ID;
  const clientSecret = process.env.FIREBASE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Define FIREBASE_CLIENT_ID y FIREBASE_CLIENT_SECRET o configura GOOGLE_APPLICATION_CREDENTIALS.');
  }
  temporaryCredentialPath = join(tmpdir(), `tapfade-stabilize-${randomUUID()}.json`);
  await writeFile(temporaryCredentialPath, JSON.stringify({ client_id: clientId, client_secret: clientSecret, refresh_token: cliConfig.tokens.refresh_token, type: 'authorized_user' }));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = temporaryCredentialPath;
}

try {
  initializeApp({ credential: applicationDefault(), projectId });
  await run(getFirestore());
} finally {
  if (temporaryCredentialPath) await unlink(temporaryCredentialPath).catch(() => {});
}

async function run(db) {
  if (restorePath) {
    const backup = JSON.parse(await readFile(restorePath, 'utf8'));
    await commit(db, backup.operations.map((item) => ({ path: item.path, after: item.before })), true);
    console.log(JSON.stringify({ restored: backup.operations.length, source: restorePath }, null, 2));
    return;
  }

  const [profilesSnapshot, shopsSnapshot, appointmentsSnapshot, slotsSnapshot] = await Promise.all([
    db.collection('users').get(), db.collection('barberShops').get(), db.collection('appointments').get(), db.collection('appointmentSlots').get(),
  ]);
  const profiles = new Map(profilesSnapshot.docs.map((item) => [item.id, item.data()]));
  const shops = new Map(shopsSnapshot.docs.map((item) => [item.id, item.data()]));
  const slots = new Map(slotsSnapshot.docs.map((item) => [item.id, item.data()]));
  const operations = [];

  const byOwner = new Map();
  for (const [id, shop] of shops) byOwner.set(shop.ownerId, [...(byOwner.get(shop.ownerId) || []), { id, ...shop }]);
  for (const [ownerId, ownerShops] of byOwner) {
    const profile = profiles.get(ownerId);
    const canonical = ownerShops.find((item) => item.id === profile?.ownerShopId) || ownerShops.sort(byCreated)[0];
    for (const shop of ownerShops) {
      if (shop.id !== canonical.id && shop.status === 'active') change(operations, `barberShops/${shop.id}`, shop, { ...shop, status: 'paused', updatedAt: new Date() });
    }
    const memberRef = db.doc(`barberShops/${canonical.id}/members/${ownerId}`);
    const member = await memberRef.get();
    if (!member.exists) change(operations, memberRef.path, null, { active: true, barberId: null, barberShopId: canonical.id, createdAt: new Date(), role: 'owner', uid: ownerId, updatedAt: new Date() });
  }

  for (const [shopId, shop] of shops) {
    const [services, barbers] = await Promise.all([
      db.collection(`barberShops/${shopId}/services`).where('active', '==', true).get(),
      db.collection(`barberShops/${shopId}/barbers`).get(),
    ]);
    const serviceIds = services.docs.map((item) => item.id);
    for (const barberDoc of barbers.docs) {
      const barber = barberDoc.data();
      if (!Array.isArray(barber.serviceIds)) change(operations, barberDoc.ref.path, barber, { ...barber, serviceIds, updatedAt: new Date() });
      if (barber.userId) {
        const profile = profiles.get(barber.userId);
        if (profile) {
          const roles = [...new Set(['client', ...(profile.roles || [profile.role || 'client']), 'barber'])];
          if (!rolesEqual(roles, profile.roles) || profile.barberShopId !== shopId) change(operations, `users/${barber.userId}`, profile, { ...profile, barberShopId: shopId, role: profile.role === 'client' ? 'barber' : profile.role, roles, updatedAt: new Date() });
        }
      }
    }
  }

  for (const appointmentDoc of appointmentsSnapshot.docs) {
    const appointment = appointmentDoc.data();
    let next = { ...appointment, revision: appointment.revision || 1, rescheduleRequest: appointment.rescheduleRequest || null };
    if (!shops.has(appointment.barberShopId)) {
      const orphanNeedsRepair = appointment.clientName !== 'Usuario eliminado'
        || ['pending', 'confirmed'].includes(appointment.status)
        || appointment.rescheduleRequest != null
        || appointment.revision == null;
      if (orphanNeedsRepair) {
        next = {
          ...next, clientName: 'Usuario eliminado', rescheduleRequest: null,
          status: ['pending', 'confirmed'].includes(appointment.status) ? 'cancelled' : appointment.status,
          revision: (appointment.revision || 1) + 1, updatedAt: new Date(),
        };
      }
    }
    const desiredSlots = new Set();
    if (shops.has(appointment.barberShopId) && ['pending', 'confirmed'].includes(next.status)) {
      const slotIds = buildSlotIds(appointment.barberShopId, appointment.barberId, appointment.startAt.toDate(), appointment.durationSnapshot);
      if (!rolesEqual(slotIds, appointment.slotIds)) next = { ...next, slotIds, revision: next.revision + 1, updatedAt: new Date() };
      slotIds.forEach((id, index) => {
        desiredSlots.add(id);
        const after = { appointmentId: appointmentDoc.id, barberId: appointment.barberId, barberShopId: appointment.barberShopId, clientId: appointment.clientId, purpose: 'appointment', slotAt: new Date(appointment.startAt.toMillis() + index * 900_000) };
        if (!slots.has(id)) change(operations, `appointmentSlots/${id}`, null, after);
      });
      if (next.rescheduleRequest) {
        const requestedIds = buildSlotIds(appointment.barberShopId, appointment.barberId, next.rescheduleRequest.startAt.toDate(), appointment.durationSnapshot);
        if (!rolesEqual(requestedIds, next.rescheduleRequest.slotIds)) {
          next = { ...next, rescheduleRequest: { ...next.rescheduleRequest, slotIds: requestedIds }, revision: next.revision + 1, updatedAt: new Date() };
        }
        requestedIds.forEach((id, index) => {
          desiredSlots.add(id);
          const after = { appointmentId: appointmentDoc.id, barberId: appointment.barberId, barberShopId: appointment.barberShopId, clientId: appointment.clientId, purpose: 'reschedule', slotAt: new Date(next.rescheduleRequest.startAt.toMillis() + index * 900_000) };
          if (!slots.has(id)) change(operations, `appointmentSlots/${id}`, null, after);
        });
      }
    }
    for (const [slotId, slot] of slots) {
      if (slot.appointmentId === appointmentDoc.id && !desiredSlots.has(slotId)) change(operations, `appointmentSlots/${slotId}`, slot, null);
    }
    if (JSON.stringify(serialize(next)) !== JSON.stringify(serialize(appointment))) change(operations, appointmentDoc.ref.path, appointment, next);
  }

  const report = { apply, projectId, operationCount: operations.length, operations: operations.map(({ path, before, after }) => ({ path, before: serialize(before), after: serialize(after) })) };
  if (apply) {
    const backupPath = join(process.cwd(), 'migration-backups', `stabilize-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await mkdir(dirname(backupPath), { recursive: true });
    await writeFile(backupPath, JSON.stringify(report, null, 2));
    await commit(db, operations, false);
    console.log(JSON.stringify({ applied: operations.length, backupPath, projectId }, null, 2));
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

function value(prefix) { return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length); }
function byCreated(left, right) { return (left.createdAt?.toMillis?.() || 0) - (right.createdAt?.toMillis?.() || 0); }
function rolesEqual(left, right = []) { return left.length === right.length && left.every((item) => right.includes(item)); }
function buildSlotIds(shopId, barberId, startAt, durationMinutes) {
  return Array.from({ length: durationMinutes / 15 }, (_item, index) => {
    const slot = new Date(startAt.getTime() + index * 900_000).toISOString().replace(/[^0-9]/g, '').slice(0, 12);
    return `${shopId}_${barberId}_${slot}`;
  });
}
function change(operations, path, before, after) { operations.push({ path, before, after }); }
function serialize(value) { return JSON.parse(JSON.stringify(value, (_key, item) => item?.toDate ? { __timestamp: item.toDate().toISOString() } : item)); }
async function commit(db, operations, serialized) {
  for (let offset = 0; offset < operations.length; offset += 400) {
    const batch = db.batch();
    for (const operation of operations.slice(offset, offset + 400)) {
      operation.after == null
        ? batch.delete(db.doc(operation.path))
        : batch.set(db.doc(operation.path), serialized ? revive(operation.after) : operation.after);
    }
    await batch.commit();
  }
}
function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    if (value.__timestamp) return new Date(value.__timestamp);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
  }
  return value;
}
