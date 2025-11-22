/**
 * Tests for Home Page (/)
 * Tests redirect behavior to /welcome
 */

import { redirect } from 'next/navigation';
import Home from '../page';

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to /welcome', () => {
    Home();
    expect(redirect).toHaveBeenCalledWith('/welcome');
  });

  it('should call redirect only once', () => {
    Home();
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
