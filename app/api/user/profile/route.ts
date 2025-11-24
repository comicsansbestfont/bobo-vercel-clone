import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, upsertUserProfile } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs'; // Use nodejs runtime for DB connections

// Schema for profile validation
const profileSchema = z.object({
  bio: z.string().optional().nullable(),
  background: z.string().optional().nullable(),
  preferences: z.string().optional().nullable(),
  technical_context: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const profile = await getUserProfile();
    return NextResponse.json(profile || {});
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const result = profileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 }
      );
    }

    const { bio, background, preferences, technical_context } = result.data;

    const profile = await upsertUserProfile({
      bio: bio ?? null,
      background: background ?? null,
      preferences: preferences ?? null,
      technical_context: technical_context ?? null,
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
