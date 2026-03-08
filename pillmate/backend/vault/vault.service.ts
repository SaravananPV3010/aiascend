import db from '../db/database';
import { randomUUID } from 'crypto';

export const VaultService = {
  addLogEntry(userFromToken: { uid: string; email: string }, entry: { type: string; details?: object }) {
    // HIGH-3: Removed ghost user upsert — a valid token must correspond to a real registered user.
    // If the user row is missing, the FK constraint will throw and the caller receives a 500.

    // HIGH-2: Generate id and timestamp server-side — never trust client values
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO vault_logs (id, user_id, type, timestamp, details)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userFromToken.uid,
      entry.type,
      timestamp,
      JSON.stringify(entry.details || {})
    );

    return { id, type: entry.type, timestamp, details: entry.details || {} };
  },

  getLogEntries(userId: string) {
    const logs = db.prepare(`
      SELECT * FROM vault_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC
    `).all(userId) as any[];

    return logs.map(log => ({
      id: log.id,
      type: log.type,
      timestamp: log.timestamp,
      details: JSON.parse(log.details)
    }));
  },

  getLogEntry(logId: string) {
    const log = db.prepare(`
      SELECT * FROM vault_logs 
      WHERE id = ?
    `).get(logId) as any;

    if (!log) return null;

    // MED-8: Include user_id so the API layer can perform an ownership check
    return {
      id: log.id,
      user_id: log.user_id,
      type: log.type,
      timestamp: log.timestamp,
      details: JSON.parse(log.details)
    };
  },

  clearLogEntries(userId: string) {
    const stmt = db.prepare(`
      DELETE FROM vault_logs WHERE user_id = ?
    `);
    
    stmt.run(userId);
    return true;
  }
};
