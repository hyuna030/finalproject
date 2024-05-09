// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, onAuthStateChanged, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';



const firebaseConfig = {
  apiKey: "AIzaSyALWTQVjtTO2wUcZG3pFGfEbDrROME8100",
  authDomain: "finalflowe.firebaseapp.com",
  projectId: "finalflowe",
  storageBucket: "finalflowe.appspot.com",
  messagingSenderId: "187765610474",
  appId: "1:187765610474:web:81708d38f90484df0cc493",
  measurementId: "G-60DWLH469T"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // 수정: getAuth 함수 사용
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, initializeApp, firestore, onAuthStateChanged, storage };
