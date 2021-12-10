let vapidKey;

fetch('/api/app/firebase-config')
    .then(response => {
        response.json()
            .then(config => {
                firebase.initializeApp(config.config);
                vapidKey = config.vapidKey
            })
    });

function getMessagingToken() {
    // Notification.requestPermission();
    const messaging = firebase.messaging();
    messaging.onMessage((payload) => {
        console.log('Message received. ', payload);
    });
    return messaging.getToken({vapidKey: vapidKey});
}
