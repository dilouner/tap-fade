export type FirestoreDate = Date | { toDate: () => Date };

export function normalizeFirestoreDate(value: FirestoreDate): Date {
  return value instanceof Date ? value : value.toDate();
}
