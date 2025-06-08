// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 디버깅용 - 환경변수 확인 (배포된 사이트에서 개발자 도구 콘솔에서 확인)
console.log('API Key from env:', process.env.REACT_APP_API_KEY);
console.log('API Key type:', typeof process.env.REACT_APP_API_KEY);
console.log('API Key length:', process.env.REACT_APP_API_KEY?.length);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "finalflowe.firebaseapp.com",
  projectId: "finalflowe",
  storageBucket: "finalflowe.appspot.com",
  messagingSenderId: "187765610474",
  appId: "1:187765610474:web:81708d38f90484df0cc493",
  measurementId: "G-60DWLH469T"
};

// 설정 확인
console.log('Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, initializeApp, firestore, onAuthStateChanged, storage };