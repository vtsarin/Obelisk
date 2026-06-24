export type Accent = 'teal' | 'blue' | 'violet' | 'rose' | 'amber';

export interface AccentOption {
  name: Accent;
  label: string;
  /** Representative swatch color (the light-mode primary fill). */
  swatch: string;
}

export const ACCENTS: AccentOption[] = [
  { name: 'teal', label: 'Teal', swatch: '#14b8a6' },
  { name: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { name: 'violet', label: 'Violet', swatch: '#8b5cf6' },
  { name: 'rose', label: 'Rose', swatch: '#f43f5e' },
  { name: 'amber', label: 'Amber', swatch: '#f59e0b' },
];

export const DEFAULT_ACCENT: Accent = 'teal';

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && ACCENTS.some((a) => a.name === value);
}
