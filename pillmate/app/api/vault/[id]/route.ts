import { NextResponse } from 'next/server';
import { VaultService } from '../../../../backend/vault/vault.service';
import { getUserFromToken } from '../../lib/auth';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // CRIT-2: Require authentication
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: logId } = await context.params;
    const log = await VaultService.getLogEntry(logId);

    if (!log) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // CRIT-2: Ownership check — prevent IDOR
    if (log.user_id !== user.uid) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Strip internal user_id before returning to client
    const { user_id: _uid, ...safeLog } = log;
    return NextResponse.json(safeLog);
  } catch (error: unknown) {
    console.error('[vault/:id GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
