
import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

interface PushPayload {
  token: string;
  title: string;
  body: string;
  url: string;
  avatar?: string;
  tag?: string;
  actions?: string; // JSON string of actions array
  callId?: string;
}

// Function to get an OAuth2 access token
async function getAccessToken() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount) {
    throw new Error('Firebase service account credentials are not set.');
  }

  const auth = new GoogleAuth({
    credentials: JSON.parse(serviceAccount),
    scopes: 'https://www.googleapis.com/auth/firebase.messaging',
  });

  const accessToken = await auth.getAccessToken();
  return accessToken;
}

export async function POST(request: Request) {
  try {
    const accessToken = await getAccessToken();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Firebase Project ID not configured.' },
        { status: 500 }
      );
    }

    const payload: PushPayload = await request.json();

    const dataPayload: { [key: string]: string } = {
        title: payload.title,
        body: payload.body,
        icon: payload.avatar || '/bytechat-logo-192.png',
        url: payload.url,
        tag: payload.tag || 'default',
        actions: payload.actions || '[]',
    };
    
    if (payload.callId) {
        dataPayload.callId = payload.callId;
    }

    const fcmV1Payload = {
      message: {
        token: payload.token,
        data: dataPayload,
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(fcmV1Payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('FCM send error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send notification', details: errorData },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    return NextResponse.json({ success: true, data: responseData });

  } catch (error: any) {
    console.error('Error in send-notification route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
