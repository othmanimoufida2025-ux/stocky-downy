import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

export function money(value: unknown): string {
  const n = Number(value) || 0;
  return `${(n / 1000).toFixed(2)} DT`;
}
