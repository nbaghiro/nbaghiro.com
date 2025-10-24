/**
 * Firestore Client for Cache Storage
 * Provides connection to Firestore with error handling
 */

import { Firestore } from "@google-cloud/firestore";

let firestoreInstance = null;

/**
 * Get Firestore instance (singleton)
 * @returns {Firestore}
 */
export function getFirestore() {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    const projectId = process.env.GCP_PROJECT_ID;

    if (!projectId) {
        console.warn(
            "[Firestore] GCP_PROJECT_ID not set, cache will be disabled"
        );
        return null;
    }

    try {
        const config = {
            projectId,
        };

        // Use service account key if provided (local development)
        const keyPath = process.env.FIRESTORE_KEY_PATH;
        if (keyPath) {
            config.keyFilename = keyPath;
            console.log(`[Firestore] Using service account key: ${keyPath}`);
        } else {
            // Use Application Default Credentials (Cloud Run)
            console.log(
                "[Firestore] Using Application Default Credentials"
            );
        }

        firestoreInstance = new Firestore(config);

        console.log(`[Firestore] Connected to project: ${projectId}`);
        return firestoreInstance;
    } catch (error) {
        console.error("[Firestore] Failed to initialize:", error.message);
        return null;
    }
}

/**
 * Get cache collection reference
 * @returns {CollectionReference|null}
 */
export function getCacheCollection() {
    const firestore = getFirestore();
    if (!firestore) return null;

    return firestore.collection("cache");
}

/**
 * Get weeks subcollection
 * @returns {CollectionReference|null}
 */
export function getWeeksCollection() {
    const cacheCollection = getCacheCollection();
    if (!cacheCollection) return null;

    return cacheCollection.doc("data").collection("weeks");
}

/**
 * Get years subcollection
 * @returns {CollectionReference|null}
 */
export function getYearsCollection() {
    const cacheCollection = getCacheCollection();
    if (!cacheCollection) return null;

    return cacheCollection.doc("data").collection("years");
}

/**
 * Test Firestore connection
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
    const firestore = getFirestore();
    if (!firestore) return false;

    try {
        // Try to read/write a test document
        const testRef = firestore.collection("_test").doc("connection");
        await testRef.set({ timestamp: Date.now() });
        await testRef.delete();

        console.log("[Firestore] Connection test successful");
        return true;
    } catch (error) {
        console.error("[Firestore] Connection test failed:", error.message);
        return false;
    }
}
