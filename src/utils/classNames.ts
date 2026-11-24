import { PracticumClass } from '../types/attendance';

export type ClassNameGroup = {
  key: string;
  classes: PracticumClass[];
};

export function normalizeClassName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function groupClassesByName(
  classes: PracticumClass[]
): ClassNameGroup[] {
  const groups = new Map<string, PracticumClass[]>();
  for (const classDoc of classes) {
    const key = normalizeClassName(classDoc.name);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.push(classDoc);
    } else {
      groups.set(key, [classDoc]);
    }
  }
  return Array.from(groups.entries()).map(([key, groupedClasses]) => ({
    key,
    classes: groupedClasses,
  }));
}
