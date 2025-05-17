// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6ijTUu1KSwbXqfRMeh9vcRXPMqpn-9DA",
  authDomain: "kerekasztal-rating.firebaseapp.com",
  projectId: "kerekasztal-rating",
  storageBucket: "kerekasztal-rating.firebasestorage.app",
  messagingSenderId: "136944666245",
  appId: "1:136944666245:web:31596e613d068462f80bec"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Export the Firestore instance
export { db };
