/**
 * Tests for API Status Route
 * Tests /api/status endpoint response based on service hours
 */

import { NextResponse } from 'next/server';
import { GET, dynamic, revalidate } from '../route';
import { isServiceOnline } from '@/lib/time';

// Mock the time utility
jest.mock('@/lib/time', () => ({
  isServiceOnline: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      json: async () => data,
      headers: new Map([['content-type', 'application/json']]),
    })),
  },
}));

describe('API Status Route', () => {
  describe('Route Configuration', () => {
    it('should have force-static dynamic configuration', () => {
      expect(dynamic).toBe('force-static');
    });

    it('should have 60 second revalidation time', () => {
      expect(revalidate).toBe(60);
    });
  });

  describe('GET endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isOnline true when service is online', async () => {
    (isServiceOnline as jest.Mock).mockReturnValue(true);
    (NextResponse.json as jest.Mock).mockReturnValue({
      json: async () => ({ isOnline: true }),
      headers: new Map([['content-type', 'application/json']]),
    });
    
    const response = await GET();
    const data = await response.json();
    
    expect(data).toEqual({ isOnline: true });
    expect(isServiceOnline).toHaveBeenCalledTimes(1);
    expect(NextResponse.json).toHaveBeenCalledWith({ isOnline: true });
  });

  it('should return isOnline false when service is offline', async () => {
    (isServiceOnline as jest.Mock).mockReturnValue(false);
    (NextResponse.json as jest.Mock).mockReturnValue({
      json: async () => ({ isOnline: false }),
      headers: new Map([['content-type', 'application/json']]),
    });
    
    const response = await GET();
    const data = await response.json();
    
    expect(data).toEqual({ isOnline: false });
    expect(isServiceOnline).toHaveBeenCalledTimes(1);
    expect(NextResponse.json).toHaveBeenCalledWith({ isOnline: false });
  });

  it('should return a valid NextResponse', async () => {
    (isServiceOnline as jest.Mock).mockReturnValue(true);
    (NextResponse.json as jest.Mock).mockReturnValue({
      json: async () => ({ isOnline: true }),
      headers: new Map([['content-type', 'application/json']]),
    });
    
    const response = await GET();
    
    expect(response).toBeDefined();
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should call isServiceOnline function', async () => {
    (isServiceOnline as jest.Mock).mockReturnValue(true);
    
    await GET();
    
    expect(isServiceOnline).toHaveBeenCalled();
  });

  it('should return consistent response format', async () => {
    (isServiceOnline as jest.Mock).mockReturnValue(false);
    
    const response = await GET();
    const data = await response.json();
    
    expect(data).toHaveProperty('isOnline');
    expect(typeof data.isOnline).toBe('boolean');
  });
  });
});
