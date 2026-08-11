/**
 * cn — Classname Utility
 *
 */

type ClassValue = 
  | string 
  | undefined 
  | false 
  | null 
  | 0 
  | ''
  | ClassValue[];

export const cn = (...classes: ClassValue[]): string => {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string') {
      result.push(cls);
    } else if (Array.isArray(cls)) {
      // Recursively process nested arrays
      const nested = cn(...cls);
      if (nested) result.push(nested);
    }
  }

  return result.join(' ');
};

export default cn;