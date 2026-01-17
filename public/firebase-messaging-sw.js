importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Remplacer par vos vraies credentials de .env (Le Service Worker ne lit pas le .env Vite)
// Il faut idéalement une étape de build qui injecte ces variables, ou les coder en dur pour le SW.
// Pour la simplicité ici, on utilise un objet config générique qui devra être rempli.
// NOTE : Le SW a besoin des clés pour initier l'app en arrière-plan.

const firebaseConfig = {
    apiKey: "AIzaSyCMKc9dTPPyPJSdJtj2v7JikAq7vmD4KH8",
    authDomain: "equinox-320c1.firebaseapp.com",
    projectId: "equinox-320c1",
    storageBucket: "equinox-320c1.firebasestorage.app",
    messagingSenderId: "902160384152",
    appId: "1:902160384152:web:3db0591c301649bdc790ed"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/Logo_equinox.png', // Icone de l'app
        badge: '/icons/icon-96x96.png' // Icone monochrome pour la barre de statut (Android)
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
