/* global require, exports */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Automated Backup Verification Cloud Function
 * Runs daily to verify all user backups
 */
exports.verifyAllBackups = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM UTC
  .timeZone('UTC')
  .onRun(async _context => {
    console.log('Starting automated backup verification...');

    const verificationResults = {
      timestamp: new Date().toISOString(),
      totalUsers: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      issues: [],
      summary: {},
    };

    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();
      verificationResults.totalUsers = usersSnapshot.size;

      console.log(`Found ${usersSnapshot.size} users to verify`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          const result = await verifyUserBackup(userId);

          if (result.success) {
            verificationResults.successfulVerifications++;
          } else {
            verificationResults.failedVerifications++;
            verificationResults.issues.push({
              userId,
              errors: result.errors,
              warnings: result.warnings,
            });
          }

          // Store verification result
          await db
            .collection('users')
            .doc(userId)
            .collection('admin')
            .doc('backup_verification')
            .set({
              ...result,
              verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (error) {
          verificationResults.failedVerifications++;
          verificationResults.issues.push({
            userId,
            error: error.message,
          });

          console.error(`Failed to verify backup for user ${userId}:`, error);
        }
      }

      // Store overall verification summary
      await db
        .collection('admin')
        .doc('backup_verification_summary')
        .set({
          ...verificationResults,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log('Backup verification completed:', verificationResults);

      return verificationResults;
    } catch (error) {
      console.error('Backup verification failed:', error);
      throw error;
    }
  });

/**
 * Verify backup for a specific user
 * @param {string} userId - User ID to verify
 * @returns {Object} Verification result
 */
async function verifyUserBackup(userId) {
  const result = {
    userId,
    timestamp: new Date().toISOString(),
    success: false,
    checks: {},
    errors: [],
    warnings: [],
  };

  try {
    // Check 1: Verify backup exists
    const backupRef = db
      .collection('users')
      .doc(userId)
      .collection('backups')
      .doc('daily_backup');
    const backupDoc = await backupRef.get();

    result.checks.backupExists = {
      exists: backupDoc.exists,
      lastModified: backupDoc.exists
        ? backupDoc.updateTime.toDate().toISOString()
        : null,
    };

    if (!backupDoc.exists) {
      result.errors.push('No backup found for user');
      return result;
    }

    const backupData = backupDoc.data();

    // Check 2: Verify backup integrity
    result.checks.integrity = await verifyBackupIntegrity(backupData);

    // Check 3: Verify data completeness
    result.checks.completeness = await verifyDataCompleteness(backupData);

    // Check 4: Verify backup freshness
    result.checks.freshness = await verifyBackupFreshness(backupData);

    // Check 5: Verify data consistency
    result.checks.consistency = await verifyDataConsistency(backupData);

    // Overall success if all critical checks pass
    result.success =
      result.checks.integrity.valid &&
      result.checks.completeness.valid &&
      result.checks.freshness.valid;

    // Log verification to audit trail
    await db
      .collection('users')
      .doc(userId)
      .collection('audit_log')
      .add({
        action: 'backup_verification',
        result: result.success ? 'success' : 'failure',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          checks: result.checks,
          errors: result.errors,
          warnings: result.warnings,
        },
      });

    return result;
  } catch (error) {
    result.errors.push(`Verification failed: ${error.message}`);
    return result;
  }
}

/**
 * Verify backup data integrity
 */
async function verifyBackupIntegrity(backupData) {
  const result = {
    valid: true,
    issues: [],
  };

  if (!backupData) {
    result.valid = false;
    result.issues.push('Backup data is null or undefined');
    return result;
  }

  // Check required fields
  const requiredFields = ['backupDate', 'dataAsOf', 'transactions'];
  for (const field of requiredFields) {
    if (!(field in backupData)) {
      result.valid = false;
      result.issues.push(`Missing required field: ${field}`);
    }
  }

  // Validate data types
  if (backupData.backupDate && typeof backupData.backupDate !== 'string') {
    result.valid = false;
    result.issues.push('backupDate must be a string');
  }

  if (backupData.transactions && !Array.isArray(backupData.transactions)) {
    result.valid = false;
    result.issues.push('transactions must be an array');
  }

  return result;
}

/**
 * Verify data completeness
 */
async function verifyDataCompleteness(backupData) {
  const result = {
    valid: true,
    issues: [],
    summary: {},
  };

  if (!backupData) {
    result.valid = false;
    result.issues.push('No backup data to verify');
    return result;
  }

  // Check transaction count
  const transactionCount = backupData.transactions
    ? backupData.transactions.length
    : 0;
  result.summary.transactionCount = transactionCount;

  if (transactionCount === 0) {
    result.issues.push('No transactions found in backup');
  }

  return result;
}

/**
 * Verify backup freshness
 */
async function verifyBackupFreshness(backupData) {
  const result = {
    valid: true,
    issues: [],
    age: null,
  };

  if (!backupData || !backupData.backupDate) {
    result.valid = false;
    result.issues.push('No backup date found');
    return result;
  }

  const backupDate = new Date(backupData.backupDate);
  const now = new Date();
  const ageInDays = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));

  result.age = ageInDays;

  // Backup should be no older than 7 days
  if (ageInDays > 7) {
    result.valid = false;
    result.issues.push(
      `Backup is ${ageInDays} days old (maximum allowed: 7 days)`
    );
  }

  return result;
}

/**
 * Verify data consistency
 */
async function verifyDataConsistency(backupData) {
  const result = {
    valid: true,
    issues: [],
  };

  if (!backupData || !backupData.transactions) {
    return result;
  }

  // Check transaction amounts are valid numbers
  backupData.transactions.forEach((transaction, index) => {
    if (
      transaction.amount &&
      (isNaN(transaction.amount) || transaction.amount < 0)
    ) {
      result.valid = false;
      result.issues.push(
        `Transaction at index ${index} has invalid amount: ${transaction.amount}`
      );
    }
  });

  return result;
}

/**
 * Manual backup verification trigger
 * Can be called via HTTP request for admin use
 */
exports.manualBackupVerification = functions.https.onRequest(
  async (req, res) => {
    cors(req, res, async () => {
      try {
        const userId = req.query.userId || req.body.userId;

        if (!userId) {
          return res
            .status(400)
            .json({ error: 'userId parameter is required' });
        }

        const result = await verifyUserBackup(userId);

        res.status(200).json(result);
      } catch (error) {
        console.error('Manual backup verification failed:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }
);

/**
 * Get backup verification status for all users (admin endpoint)
 */
exports.getBackupVerificationStatus = functions.https.onRequest(
  async (req, res) => {
    cors(req, res, async () => {
      try {
        // Get latest verification summary
        const summaryDoc = await db
          .collection('admin')
          .doc('backup_verification_summary')
          .get();

        if (!summaryDoc.exists) {
          return res
            .status(404)
            .json({ error: 'No verification summary found' });
        }

        const summary = summaryDoc.data();

        res.status(200).json(summary);
      } catch (error) {
        console.error('Failed to get backup verification status:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }
);

/**
 * Emergency backup creation function
 * Creates immediate backup for specified user
 */
exports.emergencyBackup = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const userId = req.query.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({ error: 'userId parameter is required' });
      }

      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Collect all user data
      const transactionsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .get();

      const accountsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .get();

      const settingsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .get();

      // Create emergency backup
      const emergencyBackupData = {
        backupDate: new Date().toISOString().split('T')[0],
        dataAsOf: new Date().toISOString().split('T')[0],
        backupType: 'emergency',
        transactions: transactionsSnapshot.docs.map(doc => doc.data()),
        accounts: accountsSnapshot.docs.map(doc => doc.data()),
        settings: settingsSnapshot.docs.map(doc => doc.data()),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Store emergency backup
      await db
        .collection('users')
        .doc(userId)
        .collection('backups')
        .doc('emergency_backup')
        .set(emergencyBackupData);

      // Log emergency backup creation
      await db
        .collection('users')
        .doc(userId)
        .collection('audit_log')
        .add({
          action: 'emergency_backup_created',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            backupType: 'emergency',
            transactionCount: emergencyBackupData.transactions.length,
            accountCount: emergencyBackupData.accounts.length,
          },
        });

      res.status(200).json({
        success: true,
        message: 'Emergency backup created successfully',
        backupData: {
          backupDate: emergencyBackupData.backupDate,
          transactionCount: emergencyBackupData.transactions.length,
          accountCount: emergencyBackupData.accounts.length,
        },
      });
    } catch (error) {
      console.error('Emergency backup creation failed:', error);
      res.status(500).json({ error: error.message });
    }
  });
});
