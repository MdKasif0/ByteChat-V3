
// This file needs to be in the public directory.

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase services
// are not available in the service worker.
try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
} catch (e) {
    console.error('Failed to import Firebase scripts in service worker.', e);
}


let firebaseApp;
let messaging;

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
        const firebaseConfig = event.data.config;
        if (firebaseConfig && !firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            messaging = firebase.messaging();

            // Set up the background message handler
            messaging.onBackgroundMessage((payload) => {
                console.log('[firebase-messaging-sw.js] Received background message ', payload);
                
                const notificationTitle = payload.data.title || 'New Message';
                const notificationOptions = {
                    body: payload.data.body,
                    icon: payload.data.icon || '/bytechat-logo-192.png',
                    tag: payload.data.tag || 'default',
                    data: {
                        url: payload.data.url
                    },
                    actions: payload.data.actions ? JSON.parse(payload.data.actions) : [],
                };
                
                self.registration.showNotification(notificationTitle, notificationOptions);
            });
        }
    }
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    if (event.action === 'decline-call') {
        // Handle declining the call in the background
        const callId = event.notification.data.callId;
        if (callId) {
             fetch(`/api/calls/${callId}/decline`, { method: 'POST' });
        }
        return;
    }

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                // If a window is open and it's the correct URL, just focus it
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

    