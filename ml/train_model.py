"""
Train Random Forest Regressor for used car price prediction with multiple datasets
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib
import json
import os
import glob

def load_and_prepare_data(dataset_dir='dataset'):
    """Load and prepare all CSV files in the dataset directory"""
    print("PROGRESS: 5%", flush=True)
    print("Searching for datasets...")
    csv_files = glob.glob(os.path.join(dataset_dir, 'used_output_part*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {dataset_dir}!")
        return None, None, None

    print(f"Found {len(csv_files)} files. Loading and Optimizing Memory...")
    df_list = []
    
    # Define dtypes for memory optimization
    dtypes = {
        'Year': 'int32',
        'Model_ID': 'int32',
        'Ex_Showroom_Price': 'float32',
        'total_kms': 'float32',
        'used_price': 'float32'
    }
    
    for f in csv_files:
        print(f"Loading {os.path.basename(f)}...")
        # Load and immediately downcast
        df_part = pd.read_csv(f)
        for col, dtype in dtypes.items():
            if col in df_part.columns:
                df_part[col] = df_part[col].astype(dtype)
        
        # Categorical columns to 'category' type to save memory
        cat_cols = ['Company', 'Model', 'Variant', 'Fuel', 'Transmission', 'Body_Type', 'city', 'owner_type']
        for col in cat_cols:
            if col in df_part.columns:
                df_part[col] = df_part[col].astype('category')
                
        df_list.append(df_part)
    
    df = pd.concat(df_list, ignore_index=True)
    print(f"Total dataset shape: {df.shape}")
    print("PROGRESS: 20%", flush=True)
    
    # Save variants data for frontend
    generate_variants_data(df)
    print("PROGRESS: 30%", flush=True)
    
    # Separate features and target
    features = ['Company', 'Model', 'Year', 'Model_ID', 'Variant', 'Fuel', 'Transmission', 'Body_Type', 'Ex_Showroom_Price', 'total_kms', 'city', 'owner_type']
    X = df[features]
    
    # Log transformation
    y = np.log1p(df['used_price'].astype('float32'))
    
    return X, y, df

def generate_variants_data(df):
    """Generate a nested JSON for frontend dependent dropdowns"""
    print("Generating variants_data.json for frontend...")
    
    data = {}
    
    # Group by Company, Model, Variant
    grouped = df.groupby(['Company', 'Model', 'Variant'], observed=True)
    
    for (company, model, variant), group in grouped:
        if company not in data:
            data[company] = {}
        if model not in data[company]:
            data[company][model] = {}
            
        data[company][model][variant] = {
            'fuel': list(group['Fuel'].unique()),
            'transmission': list(group['Transmission'].unique()),
            'years': sorted([int(y) for y in group['Year'].unique()]),
            'model_id': int(group['Model_ID'].iloc[0]),
            'body_type': str(group['Body_Type'].iloc[0]),
            'ex_showroom_price': float(group['Ex_Showroom_Price'].iloc[0])
        }
    
    # Save to ml directory and also attempt to save to frontend if it exists
    with open('variants_data.json', 'w') as f:
        json.dump(data, f)
    
    frontend_path = '../frontend/public/data/variants_data.json'
    os.makedirs(os.path.dirname(frontend_path), exist_ok=True)
    with open(frontend_path, 'w') as f:
        json.dump(data, f)
    
    print(f"Variants data saved to {frontend_path}")

def train_random_forest(X, y):
    """Train Random Forest Regressor model"""
    print("\nPreparing data for training...")
    
    categorical_cols = ['Company', 'Model', 'Variant', 'Fuel', 'Transmission', 'Body_Type', 'city', 'owner_type']
    numerical_cols = ['Year', 'Model_ID', 'Ex_Showroom_Price', 'total_kms']
    
    # Sampling REMOVED. Using max_samples in RF for optimization instead.

    # Create preprocessing pipeline
    from sklearn.preprocessing import OrdinalEncoder
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', numerical_cols),
            ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), categorical_cols)
        ]
    )
    
    print("PROGRESS: 40%", flush=True)
    # Create model pipeline
    model = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(
            n_estimators=20, # Start with 20 for warm_start loop
            max_depth=15,    
            min_samples_leaf=10, 
            n_jobs=-1,
            warm_start=True,
            bootstrap=True,  # Required for max_samples
            max_samples=0.1  # Each tree sees ~1M rows (10% of 10.8M)
        ))
    ])
    
    print("PROGRESS: 45% (Splitting data into train/test sets...)", flush=True)
    
    print("Splitting data into train/test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1
    )
    print("PROGRESS: 50%", flush=True)
    
    print(f"Training on {len(X_train)} rows with warm_start loop...")
    
    # Granular training loop: 50% to 85%
    total_trees = 100
    steps = 5
    trees_per_step = total_trees // steps
    
    for i in range(1, steps + 1):
        n_trees = i * trees_per_step
        progress = 50 + (i * 7) # 50% -> 57% -> 64% -> 71% -> 78% -> 85%
        print(f"PROGRESS: {progress}% (Training Model - {n_trees}/{total_trees} trees...)", flush=True)
        model.named_steps['regressor'].set_params(n_estimators=n_trees)
        model.fit(X_train, y_train)

    print("PROGRESS: 88% (Evaluating model...)", flush=True)
    
    # Predictions
    print("\nEvaluating model...")
    y_test_pred = model.predict(X_test)
    y_train_pred = model.predict(X_train)
    
    # Calculate metrics (convert back from log scale for interpretation)
    y_test_original = np.expm1(y_test)
    y_test_pred_original = np.expm1(y_test_pred)
    y_train_original = np.expm1(y_train)
    y_train_pred_original = np.expm1(y_train_pred)

    test_r2 = r2_score(y_test_original, y_test_pred_original)
    test_rmse = np.sqrt(mean_squared_error(y_test_original, y_test_pred_original))
    test_mae = mean_absolute_error(y_test_original, y_test_pred_original)
    
    train_r2 = r2_score(y_train_original, y_train_pred_original)
    train_rmse = np.sqrt(mean_squared_error(y_train_original, y_train_pred_original))
    train_mae = mean_absolute_error(y_train_original, y_train_pred_original)
    
    # Feature Importance
    importances = model.named_steps['regressor'].feature_importances_
    features_all = numerical_cols + categorical_cols
    feature_importance = dict(zip(features_all, importances.tolist()))
    
    print("\n" + "="*50)
    print("MODEL EVALUATION METRICS")
    print("="*50)
    print(f"Test R2 Score:          {test_r2:.4f}")
    print(f"Test RMSE:              {test_rmse:,.2f}")
    print(f"Train R2 Score:         {train_r2:.4f}")
    print("="*50)
    
    # Calculate accuracy (percentage of predictions within 15% of actual price)
    test_accuracy = np.mean(np.abs(y_test_original - y_test_pred_original) / y_test_original <= 0.15)
    train_accuracy = np.mean(np.abs(y_train_original - y_train_pred_original) / y_train_original <= 0.15)
    
    # Save model
    model_path = 'price_model.pkl'
    print(f"\nSaving model to {model_path}...")
    joblib.dump(model, model_path)
    
    # Save metrics
    metrics = {
        'test_r2': float(test_r2),
        'test_rmse': float(test_rmse),
        'test_mae': float(test_mae),
        'test_accuracy': float(test_accuracy),
        'train_r2': float(train_r2),
        'train_rmse': float(train_rmse),
        'train_mae': float(train_mae),
        'train_accuracy': float(train_accuracy),
        'feature_importance': feature_importance
    }
    
    metrics_path = 'model_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"Metrics saved to {metrics_path}")
    print("\nCalculated Metrics for verification:")
    print(f"Train R2: {train_r2:.4f}, Test R2: {test_r2:.4f}")
    
    print("PROGRESS: 100% (Model ready!)", flush=True)
    print("\nModel training completed successfully!")
    
    return model

if __name__ == '__main__':
    # Change working directory to script location to ensure relative paths work
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if dataset directory exists
    if not os.path.exists('dataset'):
        print("Dataset directory 'dataset' not found!")
        exit(1)
    
    # Load data
    X, y, df = load_and_prepare_data()
    
    if X is not None:
        # Train model
        model = train_random_forest(X, y)
        print("\nModel ready for predictions!")

