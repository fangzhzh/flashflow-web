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
      return NextResponse.json({ error: 'Filename parameter is missing' }, { status: 400 });
    }

    const docRef = doc(db, 'system_design_notes', filename);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const data = docSnap.data();
    return NextResponse.json({ content: data.content });
  } catch (e: any) {
    console.error('Error fetching system design note from Firestore:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch note' }, { status: 500 });
  }
}
