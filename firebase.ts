// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "finalflowe.firebaseapp.com",
  projectId: "finalflowe",
  storageBucket: "finalflowe.appspot.com",
  messagingSenderId: "187765610474",
  appId: "1:187765610474:web:81708d38f90484df0cc493",
  measurementId: "G-60DWLH469T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, initializeApp, firestore, onAuthStateChanged, storage };