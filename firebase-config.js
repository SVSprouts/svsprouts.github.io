// Get these from Firebase console → Project settings → Web app
const firebaseConfig = {
    apiKey: "AIzaSyAOWfR3KGG-ouX6Whl27lApxHMukZ2G9UE",
    authDomain: "svsprouts-a1350.firebaseapp.com",
    projectId: "svsprouts-a1350",
    storageBucket: "svsprouts-a1350.firebasestorage.app",
    messagingSenderId: "575688818236",
    appId: "1:575688818236:web:648234b064245b9bf10d39",
    measurementId: "G-6PTY3QCH6H"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
