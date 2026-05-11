"""
Prediction script for used car price and risk level
Can be called from Node.js backend
"""
import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

# Get the directory where the script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'price_model.pkl')
RISK_MODEL_PATH = os.path.join(BASE_DIR, 'risk_model.pkl')

def load_model(path):
    """Load trained model"""
    return joblib.load(path)

def predict_price_and_risk(car_data):
    """
    Predict car price and risk level from input data
    """
    try:
        price_model = load_model(MODEL_PATH)
        risk_model = load_model(RISK_MODEL_PATH)
        
        # Clamp total_kms to a realistic range
        MAX_REALISTIC_KMS = 300000
        total_kms = min(int(car_data.get('total_kms', 0)), MAX_REALISTIC_KMS)
        
        # Consistent mapping for owner_type (ensure it matches training)
        owner_type = str(car_data.get('owner_type', 'first owner')).lower()
        mapping = {
            'first owner': 'First Owner',
            'second owner': 'Second Owner',
            'third owner': 'Third Owner',
            'fourth & above': 'Fourth & Above'
        }
        car_data['owner_type'] = mapping.get(owner_type, 'First Owner')
        car_data['total_kms'] = total_kms

        # Convert to DataFrame
        df = pd.DataFrame([car_data])
        
        # Price Prediction
        prediction_log = price_model.predict(df)[0]
        prediction = np.expm1(prediction_log)
        prediction = max(0, prediction)
        
        # Risk Prediction
        risk_level = risk_model.predict(df)[0]
        
        # Calculate manual risk score for formula transparency
        age = 2024 - int(car_data.get('Year', 2024))
        owner_map = {'First Owner': 0, 'Second Owner': 1, 'Third Owner': 2, 'Fourth & Above': 3}
        owner_factor = owner_map.get(car_data['owner_type'], 3)
        risk_score = (age * 5) + (total_kms / 10000 * 3) + (owner_factor * 10)

        return {
            'success': True,
            'predicted_price': float(prediction),
            'formatted_price': f"₹{prediction:,.2f}",
            'risk_level': risk_level,
            'risk_score': round(risk_score, 2),
            'risk_formula': 'RiskScore = (Age * 5) + (kms_driven / 10000 * 3) + (OwnerFactor * 10)'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            result = predict_price_and_risk(input_data)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))
    else:
        # Example prediction
        example = {
            'Company': 'Maruti Suzuki',
            'Model': 'Swift',
            'Year': 2020,
            'Model_ID': 1,
            'Variant': 'VXI',
            'Fuel': 'Petrol',
            'Transmission': 'Manual',
            'Body_Type': 'Hatchback',
            'Ex_Showroom_Price': 600000,
            'total_kms': 30000,
            'owner_type': 'first owner',
            'city': 'mumbai'
        }
        result = predict_price_and_risk(example)
        print(json.dumps(result, indent=2))
