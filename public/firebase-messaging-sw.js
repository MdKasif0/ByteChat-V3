
// Check if Firebase has already been initialized
if (typeof self.firebase === 'undefined' || !self.firebase.apps.length) {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

    const firebaseConfig = {
        apiKey: "BIBeOCAb1yHzAJh7mAcJUTYHvfxDRAdLR24U0a3pul-XGAGlAywC83vd0P4UhacHq0Z55pSWmnuYgrXMD5Fj45o",
        authDomain: "bytechat-9fb93.firebaseapp.com",
        projectId: "bytechat-9fb93",
        storageBucket: "bytechat-9fb93.appspot.com",
        messagingSenderId: "1052348941959",
        appId: "1:1052348941959:web:d271424b81cf71f4be18c1",
    };

    self.firebase.initializeApp(firebaseConfig);
}

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationData = payload.data;
    const notificationTitle = notificationData.title;
    let actions = [];
    if (notificationData.actions) {
        try {
            actions = JSON.parse(notificationData.actions);
        } catch (e) {
            console.error("Error parsing actions: ", e);
        }
    }

    const notificationOptions = {
        body: notificationData.body,
        icon: '/bytechat-logo-192.png',
        badge: '/bytechat-badge-72.png',
        tag: notificationData.tag,
        actions: actions,
        data: {
            url: notificationData.url,
            callId: notificationData.callId,
        },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const notificationData = event.notification.data;

    const promiseChain = (async () => {
        if (event.action === 'decline-call' && notificationData.callId) {
            // Silently decline the call in the background
            try {
                await fetch(`/api/calls/${notificationData.callId}/decline`, { method: 'POST' });
            } catch (e) {
                console.error('Failed to decline call:', e);
            }
        } else if (event.action === 'accept-call' || !event.action) {
             // Default click or 'Accept' action
            const urlToOpen = new URL(notificationData.url, self.location.origin).href;
            const clientsToFocus = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });

            const client = clientsToFocus.find(c => new URL(c.url).pathname === new URL(urlToOpen).pathname);

            if (client) {
                await client.focus();
                // If the client is already open, we might need to send it a message
                // to let it know to answer the call immediately. For now, focus is enough.
                client.navigate(urlToOpen);
            } else if (self.clients.openWindow) {
                await self.clients.openWindow(urlToOpen);
            }
        }
    })();

    event.waitUntil(promiseChain);
});
