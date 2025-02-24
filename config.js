import {config} from 'dotenv';

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


export let CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export let CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export let CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

