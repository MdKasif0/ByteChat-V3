
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function POST(
    request: Request,
    { params }: { params: { callId: string } }
) {
    const callId = params.callId;
    if (!callId) {
        return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    try {
        const callDocRef = doc(db!, 'calls', callId);
        const callDoc = await getDoc(callDocRef);

        if (!callDoc.exists()) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 });
        }
        
        // Only update if the call is still ringing to prevent race conditions
        if (callDoc.data().status === 'ringing') {
            await updateDoc(callDocRef, {
                status: 'declined',
                endedAt: serverTimestamp(),
            });
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error declining call:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
