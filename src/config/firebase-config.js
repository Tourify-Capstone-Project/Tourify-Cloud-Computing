// Firebase Admin SDK
const client = require('@firebase/app');
const { getAuth } = require('@firebase/auth');
const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");
require('dotenv').config();


//========================================================================================================

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
};

const app = client.initializeApp(firebaseConfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const auth = getAuth(app);

module.exports = { app, auth };