import { NextResponse } from 'next/server';
import { AuthService } from '../../../../backend/auth/auth.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (
      typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254 ||
      typeof password !== 'string' || password.length < 8 || password.length > 128
    ) {
      return NextResponse.json(
        { error: 'A valid email and a password of at least 8 characters are required' },
        { status: 400 }
      );
    }

    const user = await AuthService.createUser(email, password);
    const token = AuthService.signToken(user);

    return NextResponse.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });
  } catch (error: unknown) {
    console.error('[auth/register]', error);
    return NextResponse.json({ error: 'Registration failed. Email may already be in use.' }, { status: 400 });
  }
}
