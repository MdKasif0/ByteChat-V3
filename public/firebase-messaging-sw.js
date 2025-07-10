
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID",
};

// Listen for the 'message' event from the main thread to receive the config
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
  }
});


self.addEventListener('push', (event) => {
    const payload = event.data.json();
    const notificationData = payload.data;

    const title = notificationData.title || 'New Message';
    const options = {
        body: notificationData.body,
        icon: notificationData.icon || '/bytechat-logo-192.png',
        badge: '/bytechat-badge.png',
        data: {
            url: notificationData.url,
            callId: notificationData.callId,
        },
        actions: notificationData.actions ? JSON.parse(notificationData.actions) : [],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url;
    const callId = event.notification.data.callId;

    if (event.action === 'decline-call' && callId) {
        // Silently decline the call in the background
        event.waitUntil(
            fetch(`/api/calls/${callId}/decline`, {
                method: 'POST',
            })
        );
    } else {
        // Default action or 'accept-call'
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                // Check if there is already a window/tab open with the target URL
                let-client-is-focused = false;
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        client.focus();
                        client-is-focused = true;
                        break;
                    }
                }
                // If not, open a new one
                if (!client-is-focused && clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});
