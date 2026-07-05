import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const notesRef = collection(db, 'system_design_notes');
    const snapshot = await getDocs(notesRef);

    const notes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        filename: data.filename || doc.id,
        title: data.title || doc.id.replace('.md', ''),
        sizeBytes: data.sizeBytes || 0,
      };
    });

    // Sort notes alphabetically
    notes.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));

    return NextResponse.json(notes);
  } catch (e: any) {
    console.error('Error listing system design notes from Firestore:', e);
    return NextResponse.json({ error: e.message || 'Failed to list notes' }, { status: 500 });
  }
}
