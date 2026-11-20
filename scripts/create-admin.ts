/**
 * Local/Cloud Shell CLI script to assign the initial Super Admin role via Firebase Admin SDK.
 * Uses Application Default Credentials (ADC) ONLY — no Service Account Private Keys required.
 *
 * Usage (with `gcloud auth application-default login` or Cloud Run Job dedicated service account):
 *   ADMIN_EMAIL=powerusertopuser@gmail.com npx tsx scripts/create-admin.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, applicationDefault, getApps, type App } from 'firebase-admin/app';
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
  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const allowUnverified = process.env.ALLOW_UNVERIFIED_ADMIN === 'true';
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.error('Error: Provide a valid ADMIN_EMAIL environment variable.');
    console.error('Example: ADMIN_EMAIL=powerusertopuser@gmail.com npx tsx scripts/create-admin.ts');
    process.exit(1);
  }

  const fbConfig = loadFirebaseConfig();
  const app = initAdminApp(fbConfig.projectId);
  const auth = getAuth(app);
  const dbId = fbConfig.firestoreDatabaseId || '(default)';
  const db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);

  console.log(`[create-admin] Looking up Firebase Auth user for ${adminEmail} in project ${fbConfig.projectId} using ADC...`);
  const userRecord = await auth.getUserByEmail(adminEmail);

  if (!userRecord.emailVerified && !allowUnverified) {
    console.error(
      `[create-admin] Refusing to elevate unverified account ${userRecord.email} (UID: ${userRecord.uid}). ` +
        'Verify the email first in Firebase Authentication or pass ALLOW_UNVERIFIED_ADMIN=true explicitly.'
    );
    process.exit(1);
  }

  const existingClaims = userRecord.customClaims || {};
  await auth.setCustomUserClaims(userRecord.uid, {
    ...existingClaims,
    admin: true,
    role: 'admin',
    superAdmin: true,
  });

  const nowIso = new Date().toISOString();
  await db.collection('user_roles').doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      role: 'admin',
      isSuperAdmin: true,
      tier: 'super_admin',
      email: userRecord.email || adminEmail,
      emailVerified: Boolean(userRecord.emailVerified),
      assignedBy: 'scripts/create-admin.ts (ADC)',
      assignedAt: nowIso,
    },
    { merge: true }
  );

  await db.collection('system_security').doc('super_admin_bootstrap').set(
    {
      completed: true,
      bootstrappedUid: userRecord.uid,
      bootstrappedEmail: userRecord.email || adminEmail,
      bootstrappedAt: nowIso,
      method: 'cli_adc',
    },
    { merge: true }
  );

  console.log('[create-admin] Success!');
  console.log(`  UID:           ${userRecord.uid}`);
  console.log(`  Email:         ${userRecord.email} (verified=${Boolean(userRecord.emailVerified)})`);
  console.log(`  Firestore:     databases/${dbId}/documents/user_roles/${userRecord.uid} (role="admin", isSuperAdmin=true)`);
  console.log('  CustomClaims:  { admin: true, role: "admin", superAdmin: true }');
  console.log('  BootstrapLock: system_security/super_admin_bootstrap (completed=true)');
  console.log('Note: If the user is currently signed in, sign out and sign back in (or click Recheck Role) to refresh their ID token.');
}

main().catch((err) => {
  console.error('[create-admin] Failed:', err?.message || err);
  process.exit(1);
});
