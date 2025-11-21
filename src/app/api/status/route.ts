import { NextResponse } from 'next/server';
import { isServiceOnline } from '@/lib/time';

export async function GET() {
  const online = isServiceOnline();
  return NextResponse.json({ isOnline: online });
}
