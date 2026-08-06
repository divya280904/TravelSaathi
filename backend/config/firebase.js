import admin from 'firebase-admin';
import fs from 'fs';

let db;

try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'travelsaathi-app';

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        console.log(`Initializing Firebase Admin with service account: ${serviceAccountPath}`);
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        console.log(`Initializing Firebase Admin with Project ID: ${projectId}`);
        admin.initializeApp({
            projectId: projectId
        });
    }

    db = admin.firestore();
    
    // Enable timestamps in snapshots (standard default in newer versions, but good to ensure compatibility)
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log("Firebase Firestore initialized successfully.");
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    // Do not hard crash immediately to let the server start and present logs
}

export { db, admin };
export default db;
