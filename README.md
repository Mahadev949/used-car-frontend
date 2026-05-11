# Smart Used Car Price Prediction Platform

A full-stack web application for predicting used car prices using Machine Learning (Random Forest Regressor) with comprehensive data analytics and visualization dashboards.

## 🎯 Features

- **4 Portals**: User, Dealer, Admin, and Data Science portals
- **ML Model**: Random Forest Regressor trained on 75,000+ synthetic car records
- **Real-time Predictions**: Instant price predictions based on car features
- **Data Visualization**: Comprehensive charts and analytics using Recharts
- **Full-Stack Architecture**: React + Node.js + PostgreSQL + Python ML

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts

### Backend
- Node.js + Express.js
- PostgreSQL
- REST APIs

### Machine Learning
- Python 3.x
- scikit-learn (Random Forest Regressor)
- pandas, numpy
- joblib

## 📁 Project Structure

```
AIML_9/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/     # Portal pages
│   │   ├── components/
│   │   ├── services/  # API services
│   │   └── charts/
├── backend/           # Node.js backend
│   ├── routes/        # API routes
│   ├── controllers/
│   ├── services/
│   └── db/            # Database connection
└── ml/                # Python ML scripts
    ├── dataset/       # Generated dataset
    ├── train_model.py
    ├── predict.py
    └── generate_dataset.py
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python 3.8+
- PostgreSQL (v12+)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb used_car_db

# Or using psql
psql -U postgres
CREATE DATABASE used_car_db;
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your database credentials

# Start backend server
npm start
# Or for development with auto-reload
npm run dev
```

### 3. Machine Learning Setup

```bash
cd ml
pip install -r requirements.txt

# Generate dataset (75,000 records)
python generate_dataset.py

# Train the model
python train_model.py
```

This will create:
- `dataset/used_cars_dataset.csv` (75,000 car records)
- `price_model.pkl` (trained model)
- `model_metrics.json` (evaluation metrics)

### 4. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`
Backend API runs on `http://localhost:5000`

## 📊 Portals

### 1. User Portal (`/user`)
- Input car details
- Get instant price predictions
- View prediction history
- Price comparison charts

### 2. Dealer Portal (`/dealer`)
- Market analytics dashboard
- Brand distribution charts
- Fuel type analysis
- City-wise distribution
- Bulk car upload (CSV)

### 3. Admin Portal (`/admin`)
- Model performance metrics (R², RMSE, MAE)
- Feature importance visualization
- Model retraining trigger
- User management

### 4. Data Science Portal (`/datascience`)
- Full dataset preview (paginated)
- Price vs Year analysis
- Price vs Kilometers scatter plot
- Fuel type distribution
- Feature importance ranking
- Model evaluation metrics

## 🔌 API Endpoints

- `POST /api/predict` - Get price prediction
- `GET /api/history?user_id=X` - Get prediction history
- `GET /api/dataset/preview` - Dataset preview
- `GET /api/dataset/stats` - Dataset statistics
- `GET /api/admin/metrics` - Model metrics
- `POST /api/admin/retrain` - Retrain model
- `GET /api/admin/users` - Get all users

## 📈 Model Metrics

The Random Forest Regressor model typically achieves:
- **R² Score**: ~0.85-0.90
- **RMSE**: Varies based on dataset
- **MAE**: Varies based on dataset

Feature importance shows which factors most influence price predictions.

## 🎨 Color Theme

- Primary: Dark Blue (#0f172a)
- Secondary: Sky Blue (#38bdf8)
- Accent: Green (#22c55e)

## 📝 Dataset

The synthetic dataset includes:
- 75,000 car records
- Indian market brands and models
- Realistic depreciation logic
- Features: brand, model, year, kms_driven, fuel_type, transmission, engine_cc, owner_type, city, price

## 🔧 Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add pages in `frontend/src/pages/`
3. **ML**: Modify training in `ml/train_model.py`

### Model Retraining

Admin can trigger model retraining from Admin Portal. The process runs asynchronously and updates metrics when complete.

## 📄 License

This project is for academic/educational purposes.

## 👨‍💻 Author

AIML Project - Used Car Price Prediction Platform

---

**Note**: Make sure PostgreSQL is running and the database is created before starting the backend server.

