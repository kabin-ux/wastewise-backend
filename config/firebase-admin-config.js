import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase service account credentials
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'firebase-service-account.json'))
);

// Initialize Firebase Admin SDK only if it hasn't been initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// ✅ Correct way to get messaging instance
export const messaging = admin.messaging();

export default admin;
