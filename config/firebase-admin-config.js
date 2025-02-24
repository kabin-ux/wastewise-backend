import admin from 'firebase-admin';
import { FIREBASE_AUTH_PROVIDER_CERT_URL, FIREBASE_AUTH_URI, FIREBASE_CLIENT_CERT_URL, FIREBASE_CLIENT_EMAIL, FIREBASE_CLIENT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_PRIVATE_KEY_ID, FIREBASE_PROJECT_ID, FIREBASE_TOKEN_URI, FIREBASE_TYPE } from '../config.js';


// Load Firebase service account credentials
const serviceAccount = {
    type: FIREBASE_TYPE,
    project_id: FIREBASE_PROJECT_ID,
    private_key_id: FIREBASE_PRIVATE_KEY_ID,
    private_key: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: FIREBASE_CLIENT_EMAIL,
    client_id: FIREBASE_CLIENT_ID,
    auth_uri: FIREBASE_AUTH_URI,
    token_uri: FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: FIREBASE_CLIENT_CERT_URL
};

// Initialize Firebase Admin SDK only if it hasn't been initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// ✅ Correct way to get messaging instance
export const messaging = admin.messaging();

export default admin;
