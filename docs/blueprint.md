# **App Name**: ByteChat

## Core Features:

- Authentication: User authentication using Firebase Auth (email/Google).
- Username setup: Prompt user to enter his name and a unique username (used as their PeerJS ID).
- New Chat initiation: Home page with a '➕ New Chat' button to connect with other users via their username.
- Real-time Chat: Real-time chat via WebRTC.
- Multimedia Support: File transfer and voice/video calls via WebRTC.
- Offline Messaging: Messages are sent via WebRTC if the user is online, else stored temporarily in Firestore, waiting for delivery.
- Auto-Reconnect: Auto-reconnect to known users using saved Peer IDs from IndexedDB.

## Style Guidelines:

- Primary color: Medium sky blue (#72BCD4) to represent communication and trust.
- Background color: Light grayish-blue (#E0F7FA), very desaturated and light, for a calm and clean feel.
- Accent color: Light grayish-green (#80CBC4), an analogous hue shifted from the primary by approximately 30 degrees toward the green part of the spectrum. Slightly brighter and more saturated than the background color, to create subtle visual interest without distracting from the content.
- Body and headline font: 'Inter' (sans-serif) for a modern and clean user interface.
- Use minimalist icons for chat actions, contact options, and media sharing, for ease of use.
- Intuitive chat layout with clear message bubbles, timestamps, and contact details, focusing on readability and ease of navigation.
- Subtle animations for message sending/receiving, and contact status updates.