import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3060';
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/login`,
      body,
    );

    const { token, user } = response.data.data;

    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 },
    );
  }
}
