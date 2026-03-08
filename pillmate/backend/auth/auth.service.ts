import db from '../db/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// CRIT-3: No fallback — missing secret is a startup failure, not a runtime default
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable must be set');
  return secret;
}

export const AuthService = {
  async createUser(email: string, passwordPlain: string) {
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(passwordPlain, 12);
    // MED-3: Cryptographically random UUID instead of timestamp-based ID
    const id = randomUUID();
    const displayName = email.split('@')[0];
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(email.substring(0, 1))}`;

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, photo_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, email, passwordHash, displayName, photoURL);

    return { uid: id, email, displayName, photoURL };
  },

  async verifyUser(email: string, passwordPlain: string) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      // Constant-time comparison to prevent timing attacks
      await bcrypt.compare(passwordPlain, '$2a$12$invalidhashpadding000000000000000000000000000000000000000');
      throw new Error('Invalid credentials');
    }

    const match = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!match) {
      throw new Error('Invalid credentials');
    }

    return { uid: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url };
  },

  signToken(user: { uid: string; email: string; displayName: string; photoURL: string }) {
    return jwt.sign(
      { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL },
      getJwtSecret(),
      { expiresIn: '24h' }
    );
  }
};
