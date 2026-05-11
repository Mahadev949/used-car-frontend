# Machine Learning Module

This directory contains the ML model training and prediction scripts.

## Files

- `generate_dataset.py` - Generates synthetic used car dataset (75,000 records)
- `train_model.py` - Trains Random Forest Regressor model
- `predict.py` - Prediction script (called by Node.js backend)
- `requirements.txt` - Python dependencies

## Usage

### 1. Generate Dataset

```bash
python generate_dataset.py
```

This creates `dataset/used_cars_dataset.csv` with 75,000 car records.

### 2. Train Model

```bash
python train_model.py
```

This will:
- Load the dataset
- Preprocess features (OneHot encoding for categorical)
- Split into train/test (80/20)
- Train Random Forest Regressor
- Evaluate and save metrics
- Save model as `price_model.pkl`

### 3. Model Evaluation

After training, check `model_metrics.json` for:
- R² Score (Train & Test)
- RMSE (Train & Test)
- MAE (Train & Test)
- Feature Importance (Top 20)

## Model Details

- **Algorithm**: Random Forest Regressor
- **Estimators**: 100 trees
- **Max Depth**: 20
- **Features**: 9 input features (brand, model, year, kms_driven, fuel_type, transmission, engine_cc, owner_type, city)
- **Target**: Price (in ₹)

## Expected Performance

- **R² Score**: ~0.85-0.90
- **RMSE**: Varies with dataset
- **MAE**: Varies with dataset

## Prediction API

The `predict.py` script is called by the Node.js backend:

```bash
python predict.py '{"brand":"Maruti Suzuki","model":"Swift","year":2020,...}'
```

Returns JSON with predicted price.

