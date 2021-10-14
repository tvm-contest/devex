/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.
 */

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
fetch('/api/app/firebase-config')
    .then(response => {
        console.log(response.body);
        response.json().then(config => {
            firebase.initializeApp(config.config);
            const messaging = firebase.messaging();
            messaging.onBackgroundMessage(function (payload) {
                console.log('[firebase-messaging-sw.js] Received background message ', payload);
                // Customize notification here
                const notificationTitle = payload.notification.title;
                const notificationOptions = {
                    body: payload.notification.body,
                    icon: '/logo.png'
                };
                self.registration.showNotification(notificationTitle, notificationOptions);
            });
        })
    });



