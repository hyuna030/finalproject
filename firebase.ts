// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 임시 하드코딩 테스트
const firebaseConfig = {
  apiKey: "AIzaSyALWTQVjtTO2wUcZG3pFGfEbDrROME8100",
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