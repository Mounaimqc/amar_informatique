importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
      apiKey: "AIzaSyAUjSJTplPn9O8pK_YU5ydsyqUQ9HVfKXo",
      authDomain: "amar-informatique.firebaseapp.com",
      projectId: "amar-informatique",
      storageBucket: "amar-informatique.firebasestorage.app",
      messagingSenderId: "568367870390",
      appId: "1:568367870390:web:e1583c182272ecbf141117"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
