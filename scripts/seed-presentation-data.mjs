import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const projectId = arg('--project=') || 'tapfade-dev';
const apply = process.argv.includes('--apply');
if (apply && arg('--confirm=') !== projectId) throw new Error(`Para aplicar usa --apply --confirm=${projectId}`);
if (projectId !== 'tapfade-dev') throw new Error('Este seed está limitado explícitamente a tapfade-dev.');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const cli = JSON.parse(await readFile(join(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json'), 'utf8'));
  if (!cli.tokens?.refresh_token) throw new Error('Inicia sesión en Firebase CLI antes de ejecutar el seed.');
  const credentialPath = join(process.env.TEMP || process.cwd(), 'tapfade-presentation-google-credentials.json');
  await writeFile(credentialPath, JSON.stringify({
    type: 'authorized_user',
    client_id: process.env.FIREBASE_CLIENT_ID || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: process.env.FIREBASE_CLIENT_SECRET || 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: cli.tokens.refresh_token,
  }));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
}
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const auth = getAuth();
const password = 'Fl3x.2025';
const stamp = Timestamp.fromDate(dayDate(0, 7));

const accounts = [
  ['demo-client', 'cliente@tapfade.test', 'Valentina Cruz', ['client'], 'valeria'],
  ['demo-owner-norte', 'duenio@tapfade.test', 'Mateo Salazar', ['client', 'owner'], 'mateo'],
  ['demo-barber-alex', 'barbero@tapfade.test', 'Alex Torres', ['client', 'barber'], 'alex'],
  ['demo-admin', 'admin@tapfade.test', 'Andrea Molina', ['client', 'admin'], 'sofia'],
  ['demo-owner-distrito', 'duenio.distrito@tapfade.test', 'Valeria Soto', ['client', 'owner'], 'valeria'],
  ['demo-owner-nomada', 'duenio.nomada@tapfade.test', 'Bruno Reyes', ['client', 'owner'], 'bruno'],
  ['demo-owner-bronce', 'duenio.bronce@tapfade.test', 'Sofía Navarro', ['client', 'owner'], 'sofia'],
  ['demo-barber-diego', 'diego@tapfade.test', 'Diego Ramírez', ['client', 'barber'], 'diego'],
  ['demo-barber-juan', 'juan@tapfade.test', 'Juan Herrera', ['client', 'barber'], 'juan'],
  ['demo-barber-emiliano', 'emiliano@tapfade.test', 'Emiliano Vega', ['client', 'barber'], 'emiliano'],
  ['demo-barber-bruno', 'bruno@tapfade.test', 'Bruno Reyes Jr.', ['client', 'barber'], 'bruno'],
  ['demo-barber-sofia', 'sofia@tapfade.test', 'Sofía Mendoza', ['client', 'barber'], 'sofia'],
];

const shops = [
  shop('demo-shop-norte', 'Norte Studio', 'demo-owner-norte', 'norte', 'Av. Universidad 3105, San Felipe, Chihuahua', 28.6548, -106.0934, 'Diseño limpio, técnica precisa y una experiencia tranquila para todos los días.'),
  shop('demo-shop-distrito', 'Distrito Barber Club', 'demo-owner-distrito', 'distrito', 'Paseo Bolívar 405, Centro, Chihuahua', 28.6372, -106.0731, 'Barbería contemporánea con detalle clásico, café y atención sin prisas.'),
  shop('demo-shop-nomada', 'Nómada Grooming House', 'demo-owner-nomada', 'nomada', 'Perif. de la Juventud 6902, Cumbres, Chihuahua', 28.6747, -106.1298, 'Cortes actuales, asesoría de imagen y acabados diseñados para ti.'),
  shop('demo-shop-bronce', 'Bronce & Navaja', 'demo-owner-bronce', 'bronce', 'Av. Mirador 7710, Campestre, Chihuahua', 28.6229, -106.1114, 'Tradición, hospitalidad y precisión en un espacio cálido y sofisticado.'),
];

const team = {
  'demo-shop-norte': [['alex', 'Alex Torres', 'demo-barber-alex', ['Fade', 'Diseño']], ['diego', 'Diego Ramírez', 'demo-barber-diego', ['Clásico', 'Barba']]],
  'demo-shop-distrito': [['valeria', 'Valeria Soto', null, ['Textura', 'Estilismo']], ['juan', 'Juan Herrera', 'demo-barber-juan', ['Fade', 'Navaja']]],
  'demo-shop-nomada': [['emiliano', 'Emiliano Vega', 'demo-barber-emiliano', ['Diseño', 'Premium']], ['bruno', 'Bruno Reyes Jr.', 'demo-barber-bruno', ['Barba', 'Clásico']]],
  'demo-shop-bronce': [['sofia', 'Sofía Mendoza', 'demo-barber-sofia', ['Clásico', 'Asesoría']], ['mateo', 'Mateo Cruz', null, ['Navaja', 'Barba']]],
};

const desired = new Map();
for (const account of accounts) {
  const [uid, email, displayName, roles, avatarKey] = account;
  const ownerShopId = shops.find((item) => item.ownerId === uid)?.id ?? null;
  const barberShopId = Object.entries(team).find(([, barbers]) => barbers.some((item) => item[2] === uid))?.[0] ?? null;
  desired.set(`users/${uid}`, { uid, email, displayName, phone: null, photoURL: null, avatarKey, role: roles.find((role) => role !== 'client') ?? 'client', roles, ownerShopId, barberShopId, createdAt: stamp, updatedAt: stamp });
}

for (const business of shops) {
  desired.set(`barberShops/${business.id}`, business);
  desired.set(`barberShops/${business.id}/members/${business.ownerId}`, member(business.ownerId, business.id, 'owner', null));
  const services = serviceCatalog(business.id);
  services.forEach((service) => desired.set(`barberShops/${business.id}/services/${service.id}`, service));
  team[business.id].forEach(([avatarKey, displayName, userId, specialties], index) => {
    const id = `barber-${index + 1}`;
    const serviceIds = index === 0 ? services.map((item) => item.id) : services.slice(0, 3).map((item) => item.id);
    desired.set(`barberShops/${business.id}/barbers/${id}`, { id, barberShopId: business.id, userId, displayName, photoUrl: null, avatarKey, specialties, serviceIds, active: true, createdAt: stamp, updatedAt: stamp });
    if (userId) desired.set(`barberShops/${business.id}/members/${userId}`, member(userId, business.id, 'barber', id));
    for (let day = 1; day <= 6; day += 1) {
      const blockId = `${id}-weekly-${day}`;
      desired.set(`barberShops/${business.id}/availability/${blockId}`, { id: blockId, barberShopId: business.id, barberId: id, dayOfWeek: day, startTime: index ? '10:00' : '09:00', endTime: index ? '19:00' : '18:00', blocked: false, kind: 'weekly', date: null, reason: null, createdAt: stamp, updatedAt: stamp });
    }
  });
}

const appointmentSpecs = [
  ['demo-appointment-completed', -1, 11, 'completed', 'demo-shop-norte', 'barber-1', 'service-fade'],
  ['demo-appointment-cancelled', -1, 16, 'cancelled', 'demo-shop-distrito', 'barber-2', 'service-barba'],
  ['demo-appointment-today-pending', 0, 11, 'pending', 'demo-shop-norte', 'barber-1', 'service-fade'],
  ['demo-appointment-today-confirmed', 0, 14, 'confirmed', 'demo-shop-norte', 'barber-2', 'service-clasico'],
  ['demo-appointment-tomorrow', 1, 10, 'confirmed', 'demo-shop-distrito', 'barber-1', 'service-premium'],
  ['demo-appointment-norte-tomorrow', 1, 15, 'pending', 'demo-shop-norte', 'barber-1', 'service-barba'],
  ['demo-appointment-day2', 2, 12, 'pending', 'demo-shop-nomada', 'barber-1', 'service-diseno'],
  ['demo-appointment-norte-day2', 2, 16, 'confirmed', 'demo-shop-norte', 'barber-2', 'service-clasico'],
  ['demo-appointment-norte-day3', 3, 10, 'pending', 'demo-shop-norte', 'barber-1', 'service-fade'],
  ['demo-appointment-day4', 4, 15, 'confirmed', 'demo-shop-bronce', 'barber-2', 'service-barba'],
  ['demo-appointment-day7', 7, 13, 'pending', 'demo-shop-norte', 'barber-1', 'service-premium'],
];
for (const spec of appointmentSpecs) addAppointment(spec);

for (const shopId of shops.map((item) => item.id)) desired.set(`users/demo-client/favorites/${shopId}`, { shopId, userId: 'demo-client', createdAt: stamp });
for (const [index, spec] of appointmentSpecs.filter((item) => ['pending', 'confirmed'].includes(item[3])).entries()) {
  const id = `demo-notification-${index + 1}`;
  desired.set(`users/demo-client/notifications/${id}`, { id, recipientId: 'demo-client', actorId: 'system', appointmentId: spec[0], title: spec[3] === 'confirmed' ? 'Cita confirmada' : 'Solicitud enviada', body: spec[3] === 'confirmed' ? 'Tu horario está confirmado. Te esperamos.' : 'La barbería recibió tu solicitud.', type: spec[3] === 'confirmed' ? 'appointment_confirmed' : 'appointment_requested', revision: 1, readAt: index > 1 ? stamp : null, createdAt: stamp });
}

const authUsers = await listAuthUsers();
const oldDemoUids = new Set(authUsers.filter((item) => item.email?.endsWith('@tapfade.test')).map((item) => item.uid));
const desiredUids = new Set(accounts.map((item) => item[0]));
const oldDemoShopIds = new Set(shops.map((item) => item.id));
const shopSnapshot = await db.collection('barberShops').get();
shopSnapshot.docs.forEach((item) => {
  const normalizedName = String(item.data().name || '').toLocaleLowerCase('es-MX').replace(/\s+/g, ' ').trim();
  if (oldDemoUids.has(item.data().ownerId) || ['black fade', 'blackfade'].includes(normalizedName)) oldDemoShopIds.add(item.id);
});

const existing = new Map();
await collectCollection(db.collection('users'), existing);
await collectCollection(db.collection('barberShops'), existing, true);
await collectCollection(db.collection('appointments'), existing);
await collectCollection(db.collection('appointmentSlots'), existing);

const deletes = [];
for (const [path, value] of existing) {
  const parts = path.split('/');
  const demoUserTree = parts[0] === 'users' && (oldDemoUids.has(parts[1]) || desiredUids.has(parts[1]));
  const demoShopTree = parts[0] === 'barberShops' && oldDemoShopIds.has(parts[1]);
  const demoAppointment = parts[0] === 'appointments' && (String(parts[1]).startsWith('demo-') || oldDemoShopIds.has(value.barberShopId) || oldDemoUids.has(value.clientId));
  const demoSlot = parts[0] === 'appointmentSlots' && (String(value.appointmentId || '').startsWith('demo-') || oldDemoShopIds.has(value.barberShopId));
  if ((demoUserTree || demoShopTree || demoAppointment || demoSlot) && !desired.has(path)) deletes.push(path);
}

const writes = [...desired].filter(([path, value]) => !same(existing.get(path), value));
const authDeletes = authUsers.filter((item) => item.email?.endsWith('@tapfade.test') && !desiredUids.has(item.uid));
const authCreates = accounts.filter(([uid, email]) => !authUsers.some((item) => item.uid === uid && item.email === email));
const summary = { projectId, mode: apply ? 'apply' : 'dry-run', firestoreWrites: writes.length, firestoreDeletes: deletes.length, authCreates: authCreates.length, authDeletes: authDeletes.length, desiredDocuments: desired.size };
console.log(JSON.stringify(summary, null, 2));
if (!apply) process.exit(0);

const backupDir = join(process.cwd(), 'scripts', 'backups');
await mkdir(backupDir, { recursive: true });
const backupPath = join(backupDir, `presentation-seed-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
await writeFile(backupPath, JSON.stringify({ projectId, createdAt: new Date().toISOString(), documents: [...new Set([...deletes, ...writes.map(([path]) => path)])].map((path) => ({ path, before: encode(existing.get(path) ?? null) })), authUsers: authUsers.filter((item) => item.email?.endsWith('@tapfade.test')).map((item) => ({ uid: item.uid, email: item.email, displayName: item.displayName, disabled: item.disabled })) }, null, 2));

for (const item of authDeletes) await auth.deleteUser(item.uid);
for (const [uid, email, displayName] of authCreates) {
  const clash = authUsers.find((item) => item.email === email && item.uid !== uid);
  if (clash && !authDeletes.some((item) => item.uid === clash.uid)) await auth.deleteUser(clash.uid);
  await auth.createUser({ uid, email, displayName, password, emailVerified: true });
}
for (const [uid, email, displayName] of accounts) {
  if (!authCreates.some((item) => item[0] === uid)) await auth.updateUser(uid, { email, displayName, emailVerified: true, disabled: false });
}
await commit(deletes.map((path) => [path, null]));
await commit(writes);
console.log(JSON.stringify({ applied: true, backupPath }, null, 2));

function shop(id, name, ownerId, coverKey, address, latitude, longitude, description) { return { id, name, description, address, photoUrl: null, coverKey, location: { latitude, longitude, geohash: '9thd' }, timezone: 'America/Chihuahua', ownerId, status: 'active', createdAt: stamp, updatedAt: stamp }; }
function member(uid, barberShopId, role, barberId) { return { uid, barberShopId, role, barberId, active: true, createdAt: stamp, updatedAt: stamp }; }
function serviceCatalog(barberShopId) { return [['service-clasico', 'Corte clásico', 240, 45], ['service-fade', 'Fade de precisión', 290, 45], ['service-barba', 'Ritual de barba', 210, 30], ['service-premium', 'Corte + barba premium', 430, 75], ['service-diseno', 'Diseño y textura', 330, 60]].map(([id, name, price, durationMinutes]) => ({ id, barberShopId, name, price, durationMinutes, active: true, createdAt: stamp, updatedAt: stamp })); }
function addAppointment([id, offset, hour, status, barberShopId, barberId, serviceId]) {
  const service = serviceCatalog(barberShopId).find((item) => item.id === serviceId);
  const barber = team[barberShopId][Number(barberId.slice(-1)) - 1];
  const startAt = Timestamp.fromDate(dayDate(offset, hour));
  const endAt = Timestamp.fromMillis(startAt.toMillis() + service.durationMinutes * 60000);
  const count = service.durationMinutes / 15;
  const slotIds = Array.from({ length: count }, (_, index) => `${barberShopId}_${barberId}_${new Date(startAt.toMillis() + index * 900000).toISOString().replace(/[^0-9]/g, '').slice(0, 12)}`);
  const appointment = { id, clientId: 'demo-client', clientName: 'Valentina Cruz', barberShopId, barberId, barberName: barber[1], serviceId, serviceName: service.name, startAt, endAt, status, priceSnapshot: service.price, durationSnapshot: service.durationMinutes, revision: 1, slotIds, rescheduleRequest: null, createdAt: stamp, updatedAt: stamp };
  desired.set(`appointments/${id}`, appointment);
  if (['pending', 'confirmed'].includes(status)) slotIds.forEach((slotId, index) => desired.set(`appointmentSlots/${slotId}`, { appointmentId: id, barberId, barberShopId, clientId: 'demo-client', purpose: 'appointment', slotAt: Timestamp.fromMillis(startAt.toMillis() + index * 900000) }));
}
function dayDate(offset, hour) { const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0'); const base = new Date(`${y}-${m}-${d}T${String(hour).padStart(2, '0')}:00:00-06:00`); base.setUTCDate(base.getUTCDate() + offset); return base; }
async function listAuthUsers() { const result = []; let token; do { const page = await auth.listUsers(1000, token); result.push(...page.users); token = page.pageToken; } while (token); return result; }
async function collectCollection(ref, target, recursive = false) { const snapshot = await ref.get(); for (const doc of snapshot.docs) { target.set(doc.ref.path, doc.data()); if (recursive) for (const sub of await doc.ref.listCollections()) await collectCollection(sub, target, true); else if (doc.ref.path.split('/')[0] === 'users') for (const sub of await doc.ref.listCollections()) await collectCollection(sub, target, true); } }
async function commit(entries) { for (let index = 0; index < entries.length; index += 400) { const batch = db.batch(); entries.slice(index, index + 400).forEach(([path, value]) => value === null ? batch.delete(db.doc(path)) : batch.set(db.doc(path), value)); await batch.commit(); } }
function encode(value) { if (value instanceof Timestamp) return { __timestamp: value.toDate().toISOString() }; if (Array.isArray(value)) return value.map(encode); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)])); return value; }
function same(left, right) { return JSON.stringify(encode(left)) === JSON.stringify(encode(right)); }
function arg(prefix) { return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length); }
