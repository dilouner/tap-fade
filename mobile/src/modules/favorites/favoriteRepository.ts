import { collection, deleteDoc, doc, onSnapshot, setDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';

export function subscribeFavoriteShopIds(userId: string, onData: (ids: string[]) => void, onError: () => void, db: Firestore = getFirebaseDb()) {
  return onSnapshot(collection(db, 'users', userId, 'favorites'), (snapshot) => onData(snapshot.docs.map((item) => item.id)), onError);
}

export async function setShopFavorite(userId: string, shopId: string, favorite: boolean, db: Firestore = getFirebaseDb()) {
  const ref = doc(db, 'users', userId, 'favorites', shopId);
  if (favorite) await setDoc(ref, { createdAt: new Date(), shopId, userId });
  else await deleteDoc(ref);
}
