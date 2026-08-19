import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { validateFile } from '@/lib/validation';
import { getStorageProvider } from '@/lib/storage';
import { VERIFICATION_STATUSES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    let verification = await db.verification.findUnique({
      where: { userId: user.id },
    });

    if (!verification) {
      verification = await db.verification.create({
        data: { userId: user.id, status: VERIFICATION_STATUSES.PENDING },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: verification.id,
        status: verification.status,
        hasFrontDocument: !!verification.frontDocumentKey,
        hasBackDocument: !!verification.backDocumentKey,
        createdAt: verification.createdAt,
        updatedAt: verification.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch verification status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const formData = await request.formData();
    const frontFile = formData.get('frontDocument') as File | null;
    const backFile = formData.get('backDocument') as File | null;

    if (!frontFile || !backFile) {
      return NextResponse.json({ success: false, error: 'Both front and back documents are required' }, { status: 400 });
    }

    // Validate files
    const frontError = validateFile(frontFile);
    if (frontError) {
      return NextResponse.json({ success: false, error: `Front document: ${frontError}` }, { status: 400 });
    }

    const backError = validateFile(backFile);
    if (backError) {
      return NextResponse.json({ success: false, error: `Back document: ${backError}` }, { status: 400 });
    }

    // Read file buffers
    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());
    const backBuffer = Buffer.from(await backFile.arrayBuffer());

    // Upload files
    const storage = getStorageProvider();
    const frontKey = await storage.uploadFile(frontBuffer, frontFile.name, frontFile.type);
    const backKey = await storage.uploadFile(backBuffer, backFile.name, backFile.type);

    // Upsert verification record
    const verification = await db.verification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        frontDocumentKey: frontKey,
        backDocumentKey: backKey,
        status: VERIFICATION_STATUSES.SUBMITTED,
      },
      update: {
        frontDocumentKey: frontKey,
        backDocumentKey: backKey,
        status: VERIFICATION_STATUSES.SUBMITTED,
      },
    });

    // Auto-approve in demo mode
    const finalVerification = await db.verification.update({
      where: { id: verification.id },
      data: { status: VERIFICATION_STATUSES.VERIFIED },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Identity Verified',
        message: 'Your identity documents have been verified successfully. You can now apply for loans.',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: finalVerification.id,
        status: finalVerification.status,
        hasFrontDocument: true,
        hasBackDocument: true,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to upload documents' }, { status: 500 });
  }
}
