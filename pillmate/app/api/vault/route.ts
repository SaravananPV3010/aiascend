import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { VaultService } from '../../../backend/vault/vault.service';

// CRIT-3: No fallback — fail fast if secret is missing
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable must be set');
  return secret;
}

// Helper to authenticate user from token
function getUserFromToken(req: Request): any | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await VaultService.getLogEntries(user.uid);
    return NextResponse.json(logs);
  } catch (error: unknown) {
    console.error('[vault GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await req.json();
    const result = await VaultService.addLogEntry(user, entry);
    
    return NextResponse.json({ success: true, entry: result });
  } catch (error: unknown) {
    console.error('[vault POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await VaultService.clearLogEntries(user.uid);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[vault DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
