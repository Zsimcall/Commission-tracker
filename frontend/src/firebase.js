import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
