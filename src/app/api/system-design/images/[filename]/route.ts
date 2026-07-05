import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new Response('Filename parameter is missing', { status: 400 });
    }

    const docRef = doc(db, 'system_design_images', filename);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new Response('Image not found', { status: 404 });
    }

    const data = docSnap.data();
    const content = data.content || '';

    return new Response(content, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('Error serving system design image from Firestore:', e);
    return new Response(e.message || 'Failed to serve image', { status: 500 });
  }
}
