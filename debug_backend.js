import pkg from 'pg';
const { Client } = pkg;
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugBackendLogic() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'used_car_db',
        password: '2003',
        port: 5432,
    });

    try {
        await client.connect();

        // 1. Get latest metrics from DB
        const dbRes = await client.query('SELECT * FROM model_metrics ORDER BY created_at DESC LIMIT 1');
        const dbMetrics = dbRes.rows[0];
        console.log('Latest DB Metrics ID:', dbMetrics.id);
        console.log('DB Accuracy:', dbMetrics.accuracy);

        // 2. Load from file
        let fileMetrics = null;
        try {
            const metricsPath = join(__dirname, 'ml/model_metrics.json');
            const metricsData = await readFile(metricsPath, 'utf-8');
            fileMetrics = JSON.parse(metricsData);
            console.log('File Accuracy:', fileMetrics.test_accuracy);
        } catch (e) {
            console.warn('Could not read model_metrics.json');
        }

        // 3. Merging logic
        const merged = {
            test_r2: Number(dbMetrics?.r2_score ?? fileMetrics?.test_r2 ?? 0),
            test_accuracy: Number(dbMetrics?.accuracy ?? fileMetrics?.test_accuracy ?? 0),
            train_accuracy: Number(dbMetrics?.train_accuracy ?? fileMetrics?.train_accuracy ?? 0),
        };

        console.log('Merged Results:', merged);
    } catch (err) {
        console.error('Debug Error:', err);
    } finally {
        await client.end();
    }
}

debugBackendLogic();
