import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugMetrics() {
    try {
        const metricsPath = join(__dirname, '../ml/model_metrics.json');
        console.log('Checking metrics path:', metricsPath);

        const metricsData = await readFile(metricsPath, 'utf-8');
        const fileMetrics = JSON.parse(metricsData);
        console.log('File Metrics Accuracy:', fileMetrics.test_accuracy);

        // Simulating the merge logic
        const dbMetrics = {
            r2_score: "0.9941",
            accuracy: null, // Simulating the NULL in Row 7
            train_accuracy: null
        };

        const merged = {
            test_accuracy: Number(dbMetrics?.accuracy ?? fileMetrics?.test_accuracy ?? 0),
            train_accuracy: Number(dbMetrics?.train_accuracy ?? fileMetrics?.train_accuracy ?? 0)
        };

        console.log('Merged Accuracy:', merged);
    } catch (err) {
        console.error('Debug Error:', err);
    }
}

debugMetrics();
