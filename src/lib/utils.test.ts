import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (classname helper)', () => {
  it('merges classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('dedupes Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
  it('handles falsy', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});
