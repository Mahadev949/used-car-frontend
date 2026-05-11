"""
Assign Risk Levels to used car dataset and train a classification model on full dataset.
Formula:
RiskScore = (Age * 5) + (kms_driven / 10000 * 3) + (OwnerFactor * 10)
Thresholds:
- Low Risk: < 30
- Medium Risk: 30 - 60
- High Risk: > 60
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json
import os
import glob

def calculate_risk_level(row):
    current_year = 2024
    age = current_year - int(row['Year'])
    
    owner_map = {
        'First Owner': 0,
        'Second Owner': 1,
        'Third Owner': 2,
        'Fourth & Above': 3
    }
    owner_factor = owner_map.get(row['owner_type'], 3)
    
    kms_driven = float(row['total_kms'])
    
    risk_score = (age * 5) + (kms_driven / 10000 * 3) + (owner_factor * 10)
    
    if risk_score < 30:
        return 'Low'
    elif risk_score < 60:
        return 'Medium'
    else:
        return 'High'

def train_risk_classifier(dataset_dir='dataset'):
    print("PROGRESS: 5%", flush=True)
    print("Loading datasets...")
    csv_files = glob.glob(os.path.join(dataset_dir, 'used_output_part*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {dataset_dir}!")
        return None

    print(f"Found {len(csv_files)} files. Loading and Optimizing Memory...")
    df_list = []
    
    # Define dtypes for memory optimization
    dtypes = {
        'Year': 'int32',
        'Model_ID': 'int32',
        'Ex_Showroom_Price': 'float32',
        'total_kms': 'float32'
    }
    
    for f in csv_files:
        print(f"Loading {os.path.basename(f)}...")
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

    # Label data
    print("Labeling data with Risk Level...")
    df['risk_level'] = df.apply(calculate_risk_level, axis=1)
    print("PROGRESS: 40%", flush=True)
    
    print("Risk Level Distribution:")
    print(df['risk_level'].value_counts())

    # Features for classification
    features = ['Company', 'Model', 'Year', 'Model_ID', 'Variant', 'Fuel', 'Transmission', 'Body_Type', 'Ex_Showroom_Price', 'total_kms', 'city', 'owner_type']
    X = df[features]
    y = df['risk_level']

    # Preprocessing
    categorical_cols = ['Company', 'Model', 'Variant', 'Fuel', 'Transmission', 'Body_Type', 'city', 'owner_type']
    numerical_cols = ['Year', 'Model_ID', 'Ex_Showroom_Price', 'total_kms']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', numerical_cols),
            ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), categorical_cols)
        ]
    )

    # Model Pipeline
    model = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=50, 
            max_depth=15, 
            random_state=42, 
            n_jobs=-1,
            bootstrap=True,
            max_samples=0.1 # Each tree sees ~1M rows
        ))
    ])

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)
    print("PROGRESS: 50%", flush=True)

    print("Training Risk Classifier on Full Dataset...")
    model.fit(X_train, y_train)
    print("PROGRESS: 80%", flush=True)

    # Evaluation
    print("Evaluating...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"Classification Accuracy: {accuracy:.4f}")
    print("PROGRESS: 90%", flush=True)

    # Save model
    model_path = 'risk_model.pkl'
    joblib.dump(model, model_path)
    print(f"Risk model saved to {model_path}")

    # Save metrics
    metrics_path = 'risk_metrics.json'
    metrics = {
        'accuracy': accuracy,
        'report': report,
        'formula': 'RiskScore = (Age * 5) + (kms_driven / 10000 * 3) + (OwnerFactor * 10)',
        'thresholds': {
            'Low': '< 30',
            'Medium': '30 - 60',
            'High': '> 60'
        }
    }
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Risk metrics saved to {metrics_path}")
    print("PROGRESS: 100%", flush=True)

    return model

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    train_risk_classifier()
