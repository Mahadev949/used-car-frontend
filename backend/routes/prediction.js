import express from 'express';
import axios from 'axios';
import { query } from '../db/connection.js';

const router = express.Router();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:10000';

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

    // Call Python prediction API
    let result;
    const targetUrl = `${ML_API_URL}/predict`;
    console.log(`[Prediction] Calling ML API: ${targetUrl}`);
    console.log(`[Prediction] Payload:`, JSON.stringify(carData));

    try {
      const response = await axios.post(targetUrl, carData, {
        timeout: 25000 // Add timeout for Render cold starts
      });
      console.log(`[Prediction] ML API Response Status: ${response.status}`);
      result = response.data;
    } catch (apiError) {
      console.error('[Prediction] ML API Error:');
      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`- Status: ${apiError.response.status}`);
        console.error(`- Data:`, apiError.response.data);
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error(`- No response received. Target: ${targetUrl}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`- Message: ${apiError.message}`);
      }
      
      return res.status(500).json({
        success: false,
        error: apiError.response?.data?.error || apiError.message || 'ML Prediction Service unavailable',
        debug_info: {
          target_url: targetUrl,
          error_message: apiError.message
        }
      });
    }

    if (!result || !result.success) {
      console.error('[Prediction] ML Result Failed:', result);
      return res.status(500).json({
        success: false,
        error: result?.error || 'Prediction failed',
        debug_info: result
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

export default router;

