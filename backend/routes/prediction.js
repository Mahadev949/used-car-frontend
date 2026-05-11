import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../db/connection.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// POST /api/predict
router.post('/', async (req, res) => {
  try {
    const { brand, model, year, kms_driven, fuel_type, transmission,
      variant, body_type, ex_showroom_price, model_id, owner_type, city, user_id } = req.body;

    // Validate input
    const requiredFields = ['brand', 'model', 'year', 'fuel_type', 'transmission', 'variant', 'owner_type', 'city'];
    const missing = requiredFields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
    if (kms_driven === undefined || kms_driven === null) missing.push('kms_driven');

    if (missing.length > 0) {
      console.log('Missing fields:', missing);
      return res.status(400).json({
        success: false,
        error: `[v2] Missing required fields: ${missing.join(', ')}`,
        received: req.body
      });
    }

    // Prepare car data for ML model with correct mapping
    const carData = {
      'Company': brand,
      'Model': model,
      'Year': parseInt(year),
      'Model_ID': parseInt(model_id) || 0,
      'Variant': variant,
      'Fuel': fuel_type,
      'Transmission': transmission,
      'Body_Type': body_type || 'Unknown',
      'Ex_Showroom_Price': parseFloat(ex_showroom_price) || 0,
      'total_kms': parseInt(kms_driven),
      'city': city.toLowerCase(),
      'owner_type': owner_type.toLowerCase()
    };

    // Call Python prediction script
    const pythonScript = join(__dirname, '../../ml/predict.py');
    const result = await runPythonScript(pythonScript, JSON.stringify(carData));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Prediction failed'
      });
    }

    const predictedPrice = result.predicted_price;

    // Save prediction to database
    if (user_id) {
      try {
        await query(
          `INSERT INTO predictions 
           (user_id, brand, model, year, kms_driven, fuel_type, transmission, 
            variant, body_type, ex_showroom_price, owner_type, city, predicted_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [user_id, brand, model, year, kms_driven, fuel_type, transmission,
            variant, body_type, ex_showroom_price, owner_type, city, predictedPrice]
        );
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Note: This may fail if table schema hasn't updated yet. 
        // We'll proceed to return the prediction regardless.
      }
    }

    res.json({
      success: true,
      predicted_price: predictedPrice,
      formatted_price: `₹${predictedPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      risk_formula: result.risk_formula,
      input_data: {
        brand, model, year: parseInt(year), kms_driven: parseInt(kms_driven),
        fuel_type, transmission, variant, body_type, ex_showroom_price,
        model_id, owner_type, city
      }
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function runPythonScript(scriptPath, inputData) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath, inputData]);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        resolve({ success: false, error: errorOutput || 'Python script failed' });
      } else {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse prediction result' });
        }
      }
    });
  });
}

export default router;

