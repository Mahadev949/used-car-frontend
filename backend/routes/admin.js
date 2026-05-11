import express from 'express';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../db/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global state for training status
let trainingStatus = {
  active: false,
  progress: 0,
  message: 'Idle',
  lastCompleted: null,
  error: null
};

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/training-status
router.get('/training-status', (req, res) => {
  res.json({
    success: true,
    status: trainingStatus
  });
});

// POST /api/admin/retrain
router.post('/retrain', async (req, res) => {
  try {
    if (trainingStatus.active) {
      return res.status(400).json({
        success: false,
        error: 'Training is already in progress'
      });
    }

    const trainScript = join(__dirname, '../../ml/train_model.py');

    // Reset status
    trainingStatus = {
      active: true,
      progress: 0,
      message: 'Initializing...',
      lastCompleted: null,
      error: null
    };

    // Run training with -u for unbuffered output
    const python = spawn('python', ['-u', trainScript], {
      cwd: join(__dirname, '../../ml')
    });

    python.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);

      // Parse progress: PROGRESS: X% (Message)
      const progressMatch = output.match(/PROGRESS: (\d+)%(?:\s+\((.*)\))?/);
      if (progressMatch) {
        trainingStatus.progress = parseInt(progressMatch[1]);
        const statusMsg = progressMatch[2] || 'Training in progress...';
        trainingStatus.message = `${statusMsg} (${trainingStatus.progress}%)`;
      }
    });

    python.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.error(errorOutput);
      // We don't set error here as stderr is often used for warnings
    });

    python.on('close', async (code) => {
      if (code === 0) {
        trainingStatus.progress = 100;
        trainingStatus.message = 'Saving metrics...';
        // Load and save metrics to database
        await loadAndSaveMetrics();
        trainingStatus.message = 'Completed';
        trainingStatus.lastCompleted = new Date();
      } else {
        trainingStatus.error = 'Training process exited with code ' + code;
        trainingStatus.message = 'Failed';
      }
      // Set active to false ONLY after everything is done
      trainingStatus.active = false;
    });

    // Return immediately (async training)
    res.json({
      success: true,
      message: 'Model retraining started.'
    });

  } catch (error) {
    console.error('Retrain error:', error);
    trainingStatus.active = false;
    trainingStatus.error = error.message;
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Training status route was here

async function loadAndSaveMetrics() {
  try {
    const metricsPath = join(__dirname, '../../ml/model_metrics.json');
    const metricsData = await readFile(metricsPath, 'utf-8');
    const metrics = JSON.parse(metricsData);

    await query(
      `INSERT INTO model_metrics 
       (r2_score, rmse, mae, train_r2, train_rmse, train_mae, accuracy, train_accuracy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        metrics.test_r2,
        metrics.test_rmse,
        metrics.test_mae,
        metrics.train_r2,
        metrics.train_rmse,
        metrics.train_mae,
        metrics.test_accuracy,
        metrics.train_accuracy
      ]
    );
    console.log('✅ Metrics saved to database successfully');
  } catch (error) {
    console.error('❌ Error saving metrics to database:', error);
  }
}

// GET /api/admin/metrics
router.get('/metrics', async (req, res) => {
  try {
    // Get latest metrics from database
    const dbRes = await query(
      'SELECT * FROM model_metrics ORDER BY created_at DESC LIMIT 1'
    );
    const dbMetrics = dbRes.rows[0];

    // Load from file for backup and feature importance
    let fileMetrics = null;
    try {
      const metricsPath = join(__dirname, '../../ml/model_metrics.json');
      const metricsData = await readFile(metricsPath, 'utf-8');
      fileMetrics = JSON.parse(metricsData);
    } catch (e) {
      console.warn('Could not read model_metrics.json file:', e.message);
    }

    if (!dbMetrics && !fileMetrics) {
      console.warn('⚠️ No metrics found in DB and model_metrics.json is missing');
      return res.status(404).json({
        success: false,
        error: 'Model metrics not found. Please train the model first.'
      });
    }

    // Merge logic: Prioritize fileMetrics (usually fresher) but fallback to DB
    const merged = {
      test_r2: Number(fileMetrics?.test_r2 ?? dbMetrics?.r2_score ?? 0),
      test_rmse: Number(fileMetrics?.test_rmse ?? dbMetrics?.rmse ?? 0),
      test_mae: Number(fileMetrics?.test_mae ?? dbMetrics?.mae ?? 0),
      test_accuracy: Number(fileMetrics?.test_accuracy ?? dbMetrics?.accuracy ?? 0),
      train_r2: Number(fileMetrics?.train_r2 ?? dbMetrics?.train_r2 ?? 0),
      train_rmse: Number(fileMetrics?.train_rmse ?? dbMetrics?.train_rmse ?? 0),
      train_mae: Number(fileMetrics?.train_mae ?? dbMetrics?.train_mae ?? 0),
      train_accuracy: Number(fileMetrics?.train_accuracy ?? dbMetrics?.train_accuracy ?? 0),
      feature_importance: fileMetrics?.feature_importance || {}
    };

    res.json({
      success: true,
      metrics: merged
    });

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: users.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/users/:id  – removes user login + all associated data
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Prevent admins from deleting themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    // Fetch the target user to verify it exists
    const userRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 1. Delete prediction history
    await query('DELETE FROM predictions WHERE user_id = $1', [userId]);

    // 2. Delete cars linked to the user's dealer record, then dealer record itself
    const dealerRes = await query('SELECT id FROM dealers WHERE user_id = $1', [userId]);
    if (dealerRes.rows.length > 0) {
      const dealerId = dealerRes.rows[0].id;
      await query('DELETE FROM cars WHERE dealer_id = $1', [dealerId]);
      await query('DELETE FROM dealers WHERE id = $1', [dealerId]);
    }

    // 3. Delete the user account
    await query('DELETE FROM users WHERE id = $1', [userId]);

    console.log(`✅ Admin deleted user ${userId} and all their data`);
    res.json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

