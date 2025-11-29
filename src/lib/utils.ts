/**
 * CSS Class Name Utilities
 *
 * @description Provides utilities for combining and merging CSS class names
 * with Tailwind CSS conflict resolution.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine and merge CSS class names with Tailwind CSS conflict resolution
 *
 * @description Uses clsx for conditional class joining and tailwind-merge
 * to properly handle Tailwind CSS class conflicts (e.g., `p-2 p-4` becomes `p-4`).
 *
 * @param inputs - Class values to combine (strings, arrays, objects, etc.)
 * @returns Merged class name string
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-2 py-1', 'bg-blue-500')
 * // => 'px-2 py-1 bg-blue-500'
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active', isDisabled && 'opacity-50')
 * // => 'base-class active' (if isActive is true, isDisabled is false)
 *
 * // Conflict resolution
 * cn('p-2', 'p-4')
 * // => 'p-4' (later class wins)
 *
 * // Object syntax
 * cn({ 'bg-red-500': hasError, 'bg-green-500': !hasError })
 * // => 'bg-red-500' or 'bg-green-500'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
