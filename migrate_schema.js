import { query } from './backend/db/connection.js';

async function updateSchema() {
    try {
        console.log('Attempting to update predictions table schema...');

        // Add columns if they don't exist
        await query(`
      ALTER TABLE predictions ADD COLUMN IF NOT EXISTS variant VARCHAR(100);
      ALTER TABLE predictions ADD COLUMN IF NOT EXISTS body_type VARCHAR(100);
      ALTER TABLE predictions ADD COLUMN IF NOT EXISTS ex_showroom_price DECIMAL(12, 2);
    `);

        console.log('✅ Predictions table schema updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to update schema:', error);
        process.exit(1);
    }
}

updateSchema();
