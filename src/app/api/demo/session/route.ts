import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDemoUser, AuthError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateDemoUser(request);
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDemo: user.isDemo,
        balance: user.balance,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to create demo session' }, { status: 500 });
  }
}
