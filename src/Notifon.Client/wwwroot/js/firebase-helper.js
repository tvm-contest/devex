async function getMessagingToken() {
    const configResponse = await fetch('/api/app/firebase-config');
    const config = await configResponse.json();

    console.log('Firebase config:', config);

    firebase.initializeApp(config.config);

    const messaging = firebase.messaging();

    return messaging.getToken({vapidKey: config.vapidKey})
} 
