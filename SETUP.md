# Setup Guide

## Quick Start

### Step 1: Database Setup

```bash
# Install PostgreSQL if not already installed
# Then create database:

psql -U postgres
CREATE DATABASE used_car_db;
\q
```

### Step 2: Generate Dataset & Train Model

```bash
cd ml
pip install -r requirements.txt

# Generate 75,000 car records
python generate_dataset.py

# Train Random Forest model
python train_model.py
```

This creates:
- `ml/dataset/used_cars_dataset.csv` (75,000 records)
- `ml/price_model.pkl` (trained model)
- `ml/model_metrics.json` (evaluation metrics)

### Step 3: Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=used_car_db
# DB_USER=postgres
# DB_PASSWORD=your_password

# Start backend
npm start
```

Backend runs on `http://localhost:5000`

### Step 4: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Verify Installation

1. Open `http://localhost:3000` in browser
2. Navigate to User Portal
3. Fill car details and click "Predict Price"
4. Check Data Science Portal for dataset preview
5. Check Admin Portal for model metrics

## Troubleshooting

### Python/ML Issues
- Ensure Python 3.8+ is installed
- Install dependencies: `pip install -r ml/requirements.txt`
- Check if dataset was generated: `ls ml/dataset/`

### Database Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database exists: `psql -U postgres -l | grep used_car_db`
- Verify credentials in `backend/.env`

### Backend Issues
- Check if port 5000 is available
- Verify all npm packages installed: `cd backend && npm list`
- Check backend logs for errors

### Frontend Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if backend is running (frontend proxies to localhost:5000)
- Check browser console for errors

## Default Admin Credentials

- Username: `admin`
- Password: `admin123` (for demo purposes only)

## Next Steps

1. Explore all 4 portals
2. Make predictions in User Portal
3. View analytics in Dealer Portal
4. Check model metrics in Admin Portal
5. Explore dataset in Data Science Portal

