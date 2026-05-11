import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMerge() {
    // Mock DB metrics (Row 7)
    const dbMetrics = {
        r2_score: "0.9942",
        rmse: "162905.38",
        mae: "48871.90",
        train_r2: "0.9942",
        train_rmse: "162090.52",
        train_mae: "48360.55",
        accuracy: "0.9490", // What I manually updated
        train_accuracy: "0.9496"
    };

    // Mock File metrics
    let fileMetrics = null;
    try {
        const metricsPath = join(__dirname, 'ml/model_metrics.json');
        const metricsData = await readFile(metricsPath, 'utf-8');
        fileMetrics = JSON.parse(metricsData);
    } catch (e) {
        console.warn('File not found');
    }

    console.log('File Metrics Read:', fileMetrics ? 'Success' : 'Failed');

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

    console.log('Merged metrics:', JSON.stringify(merged, null, 2));
}

testMerge();
