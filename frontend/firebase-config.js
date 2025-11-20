// Get these from Firebase console → Project settings → Web app
const firebaseConfig = {
  apiKey: "AIzaSyC8qrJQJRzjkUUpiIL8JGMc7DfKAKdbOLQ",
  authDomain: "appihippi-93778.firebaseapp.com",
  projectId: "appihippi-93778",
  storageBucket: "appihippi-93778.firebasestorage.app",
  messagingSenderId: "394398291893",
  appId: "1:394398291893:web:508c0aa0fdd79abc97abfc",
  measurementId: "G-FJXT4ZGBVL"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
