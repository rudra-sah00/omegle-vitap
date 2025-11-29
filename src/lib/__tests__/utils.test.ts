import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (class name utility)', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should resolve Tailwind conflicts (later class wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined)).toBe('');
  });

  it('should handle object syntax', () => {
    expect(cn({ 'bg-red-500': true, 'bg-green-500': false })).toBe('bg-red-500');
  });

  it('should handle arrays', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('should handle complex combinations', () => {
    const result = cn(
      'base-class',
      'px-2 py-4',
      { 'hover:bg-blue-500': true },
      ['rounded-md', 'shadow-lg'],
      false && 'hidden',
      null,
      undefined
    );
    expect(result).toBe('base-class px-2 py-4 hover:bg-blue-500 rounded-md shadow-lg');
  });

  it('should handle responsive variants correctly', () => {
    expect(cn('md:p-2', 'md:p-4')).toBe('md:p-4');
  });
});
