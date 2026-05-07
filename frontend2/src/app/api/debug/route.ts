import { NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET() {
  const dbUrl = (globalThis as any).TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? 'UNDEFINED';
  const hasToken = !!((globalThis as any).TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN);
  const envKeys = Object.keys(process.env || {});
  return NextResponse.json({ dbUrl, hasToken, envKeys });
}
