/**
 * Local CLI script to assign the first Admin role via Firebase Admin SDK.
 * Usage:
 *   ADMIN_EMAIL=you@example.com npx tsx scripts/create-admin.ts
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or GCP Application Default Credentials
 * with permissions for Firebase Auth & Cloud Firestore on the target project.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, applicationDefault, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface FirebaseConfigFile {
  projectId: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseConfigFile {
  const configPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing firebase-applet-config.json at ${configPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!parsed.projectId) {
    throw new Error('firebase-applet-config.json is missing projectId.');
  }
  return {
    projectId: parsed.projectId,
    firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)',
  };
}

function initAdminApp(projectId: string): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawServiceAccount) {
    const parsedCred = JSON.parse(rawServiceAccount);
    return initializeApp({
      credential: cert(parsedCred),
      projectId,
    });
  }
  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.error('Error: Provide a valid ADMIN_EMAIL environment variable.');
    console.error('Example: ADMIN_EMAIL=owner@yourdomain.com npx tsx scripts/create-admin.ts');
    process.exit(1);
  }

  const fbConfig = loadFirebaseConfig();
  const app = initAdminApp(fbConfig.projectId);
  const auth = getAuth(app);
  const dbId = fbConfig.firestoreDatabaseId || '(default)';
  const db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);

  console.log(`[create-admin] Looking up Firebase Auth user for ${adminEmail} in project ${fbConfig.projectId}...`);
  const userRecord = await auth.getUserByEmail(adminEmail);

  const existingClaims = userRecord.customClaims || {};
  await auth.setCustomUserClaims(userRecord.uid, {
    ...existingClaims,
    admin: true,
    role: 'admin',
  });

  const nowIso = new Date().toISOString();
  await db.collection('user_roles').doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      role: 'admin',
      email: userRecord.email || adminEmail,
      assignedBy: 'scripts/create-admin.ts',
      assignedAt: nowIso,
    },
    { merge: true }
  );

  console.log('[create-admin] Success!');
  console.log(`  UID:         ${userRecord.uid}`);
  console.log(`  Email:       ${userRecord.email}`);
  console.log(`  Firestore:   databases/${dbId}/documents/user_roles/${userRecord.uid} (role="admin")`);
  console.log('  CustomClaim: { admin: true, role: "admin" }');
  console.log('Note: If the user is currently signed in, they should sign out and sign back in to refresh their ID token.');
}

main().catch((err) => {
  console.error('[create-admin] Failed:', err?.message || err);
  process.exit(1);
});
