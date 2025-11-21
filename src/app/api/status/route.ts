import { NextResponse } from 'next/server';
import { isServiceOnline } from '@/lib/time';

export const dynamic = 'force-static';
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const online = isServiceOnline();
  return NextResponse.json({ isOnline: online });
}
