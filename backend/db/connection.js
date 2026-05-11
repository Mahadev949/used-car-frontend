import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'used_car_db',
  password: process.env.DB_PASSWORD || 'hemu4125',
  port: process.env.DB_PORT || 5432,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export async function initDatabase() {
  try {
    // Create tables
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Dealers table
      CREATE TABLE IF NOT EXISTS dealers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        dealer_name VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Cars table (for dealer bulk uploads)
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        dealer_id INTEGER REFERENCES dealers(id),
        car_id VARCHAR(50) UNIQUE,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        kms_driven INTEGER NOT NULL,
        fuel_type VARCHAR(50) NOT NULL,
        transmission VARCHAR(50) NOT NULL,
        owner_type VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        price DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Predictions table
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        car_id VARCHAR(50),
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        kms_driven INTEGER NOT NULL,
        fuel_type VARCHAR(50) NOT NULL,
        transmission VARCHAR(50) NOT NULL,
        variant VARCHAR(100),
        body_type VARCHAR(100),
        ex_showroom_price DECIMAL(12, 2),
        owner_type VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        predicted_price DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Model metrics table
      CREATE TABLE IF NOT EXISTS model_metrics (
        id SERIAL PRIMARY KEY,
        r2_score DECIMAL(10, 4),
        rmse DECIMAL(12, 2),
        mae DECIMAL(12, 2),
        train_r2 DECIMAL(10, 4),
        train_rmse DECIMAL(12, 2),
        train_mae DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
      CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);
      CREATE INDEX IF NOT EXISTS idx_cars_dealer_id ON cars(dealer_id);
    `;

    await pool.query(createTablesSQL);
    console.log('✅ Database tables created/verified');

    // Migration: Remove engine_cc column from predictions and cars tables if it exists
    try {
      await pool.query('ALTER TABLE predictions DROP COLUMN IF EXISTS engine_cc');
      await pool.query('ALTER TABLE cars DROP COLUMN IF EXISTS engine_cc');
      console.log('✅ Removed engine_cc column from tables');
    } catch (dropError) {
      console.log('ℹ️ Migration notice:', dropError.message);
    }

    // Create default admin user (password: admin123) - will be hashed on first login/register
    // Note: For existing installations, you may need to manually hash the password

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export default pool;

