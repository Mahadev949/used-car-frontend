import express from 'express';
import { readFile, access } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { parse as csvParseStream } from 'csv-parse';
import archiver from 'archiver';
import multer from 'multer';
import { readdir } from 'fs/promises';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants for lazy loading
const PART_SIZE = 1000000;
const TOTAL_PARTS = 11;
const STATS_PATH = join(__dirname, '../../ml/dataset_stats.json');
const DATASET_DIR = join(__dirname, '../../ml/dataset');

// GET /api/dataset/stats
router.get('/stats', async (req, res) => {
  try {
    console.log('Loading pre-calculated dataset statistics...');

    // Attempt to read pre-calculated stats
    try {
      await access(STATS_PATH);
      const statsContent = await readFile(STATS_PATH, 'utf-8');
      const stats = JSON.parse(statsContent);

      console.log('Statistics loaded from cache.');
      return res.json({ success: true, stats });
    } catch (err) {
      console.log('Pre-calculated stats not found. Falling back to basic load.');
    }

    // Fallback logic for small/initial datasets if needed
    const defaultStats = {
      total_records: 0,
      price_stats: { min: 0, max: 0, mean: 0, median: 0 },
      brand_distribution: {},
      model_distribution: {},
      fuel_type_distribution: {},
      city_distribution: {},
      year_range: { min: 0, max: 0 }
    };

    res.json({ success: true, stats: defaultStats });

  } catch (error) {
    console.error('Dataset stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/dataset/preview
router.get('/preview', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // 1. Determine which part file(s) we need
    const startPart = Math.floor(offset / PART_SIZE) + 1;
    // For simplicity, we assume the requested range fits into one or two parts
    // and we'll just handle the first part that contains the offset.
    const partFile = startPart <= 11 ? `used_output_part${startPart}.csv` : 'used_output_part1.csv';
    const relativeOffset = offset % PART_SIZE;
    const filePath = join(DATASET_DIR, partFile);

    console.log(`Preview: Offset ${offset} -> Loading ${partFile} at relative offset ${relativeOffset}`);

    const results = [];
    let counter = 0;
    let processed = 0;

    // Use stream to skip rows efficiently
    const parser = fs.createReadStream(filePath).pipe(
      csvParseStream({
        columns: true,
        skip_empty_lines: true
      })
    );

    for await (const row of parser) {
      if (counter >= relativeOffset) {
        results.push({
          car_id: offset + processed + 1,
          brand: row.Company,
          model: row.Model,
          variant: row.Variant,
          year: parseInt(row.Year),
          fuel_type: row.Fuel,
          transmission: row.Transmission,
          kms_driven: parseInt(row.total_kms),
          city: row.city,
          price: parseFloat(row.used_price)
        });
        processed++;
        if (processed >= limit) break;
      }
      counter++;
    }

    // Get total from stats for UI
    let totalRows = 10878912;
    try {
      const statsContent = await readFile(STATS_PATH, 'utf-8');
      const stats = JSON.parse(statsContent);
      totalRows = stats.total_records;
    } catch (e) {
      // Fallback to approximate total if stats not found
    }

    res.json({
      success: true,
      data: results,
      total: totalRows,
      limit,
      offset
    });

  } catch (error) {
    console.error('Dataset preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const upload = multer({ dest: 'temp_uploads/' });

// GET /api/dataset/download
router.get('/download', async (req, res) => {
  try {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('dataset_all.zip');

    archive.pipe(res);

    const files = await readdir(DATASET_DIR);
    const csvFiles = files.filter(f => f.endsWith('.csv'));

    for (const file of csvFiles) {
      archive.file(join(DATASET_DIR, file), { name: file });
    }

    archive.finalize();
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/dataset/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const files = await readdir(DATASET_DIR);
    const partNumbers = files
      .map(f => {
        const match = f.match(/used_output_part(\d+)\.csv/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => b - a);

    const nextPart = (partNumbers[0] || 0) + 1;
    const newFileName = `used_output_part${nextPart}.csv`;
    const targetPath = join(DATASET_DIR, newFileName);

    await fs.promises.rename(req.file.path, targetPath);

    res.json({
      success: true,
      message: `File uploaded and renamed to ${newFileName}`,
      fileName: newFileName
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

