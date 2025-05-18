import { config } from 'dotenv';

config();

export let PORT = process.env.PORT;
export let MONGODB_URL = process.env.MONGODB_URL;

export let ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export let ACCESS_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_KEY;


export let REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export let REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

export let ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export let BASE_URL = process.env.BASE_URL;
export let API_BASE_URL = process.env.API_BASE_URL;

export let HOST = process.env.HOST;
export let SERVICE = process.env.SERVICE;

export let EMAIL_PORT = process.env.EMAIL_PORT;

export let SECURE = process.env.SECURE;

export let USER = process.env.USER;
export let PASS = process.env.PASS;

export let VAPID_KEY = process.env.VAPID_KEY;

export let FIREBASE_TYPE = process.env.FIREBASE_TYPE;
export let FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
export let FIREBASE_PRIVATE_KEY_ID = process.env.FIREBASE_PRIVATE_KEY_ID;
export let FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
export let FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
export let FIREBASE_CLIENT_ID = process.env.FIREBASE_CLIENT_ID;
export let FIREBASE_AUTH_URI = process.env.FIREBASE_AUTH_URI;
export let FIREBASE_TOKEN_URI = process.env.FIREBASE_TOKEN_URI;
export let FIREBASE_AUTH_PROVIDER_CERT_URL = process.env.FIREBASE_AUTH_PROVIDER_CERT_URL;
export let FIREBASE_CLIENT_CERT_URL = process.env.FIREBASE_CLIENT_CERT_URL;

export let CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export let CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export let CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export let PASSWORD_SECRET = process.env.PASSWORD_SECRET;

