"""
Generate synthetic used car dataset with Indian market characteristics
Dataset size: 50,000 - 100,000 records
"""
import pandas as pd
import numpy as np
import random
from datetime import datetime

# Indian car brands and models
BRANDS = ['Maruti Suzuki', 'Hyundai', 'Mahindra', 'Tata', 'Honda', 'Toyota', 
          'Ford', 'Volkswagen', 'Skoda', 'Nissan', 'Renault', 'Kia', 'MG', 'Jeep']

MODELS = {
    'Maruti Suzuki': ['Swift', 'Dzire', 'Baleno', 'Wagon R', 'Alto', 'Celerio', 'Ertiga', 'Vitara Brezza'],
    'Hyundai': ['i20', 'i10', 'Creta', 'Verna', 'Elantra', 'Tucson', 'Venue', 'Santro'],
    'Mahindra': ['Scorpio', 'XUV500', 'Bolero', 'Thar', 'XUV300', 'TUV300'],
    'Tata': ['Nexon', 'Harrier', 'Safari', 'Tiago', 'Altroz', 'Punch', 'Tigor'],
    'Honda': ['City', 'Amaze', 'WR-V', 'CR-V', 'Civic'],
    'Toyota': ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Glanza'],
    'Ford': ['EcoSport', 'Endeavour', 'Figo', 'Aspire'],
    'Volkswagen': ['Polo', 'Vento', 'Tiguan', 'Virtus'],
    'Skoda': ['Rapid', 'Octavia', 'Superb', 'Kushaq'],
    'Nissan': ['Micra', 'Sunny', 'Terrano', 'Magnite'],
    'Renault': ['Kwid', 'Duster', 'Triber', 'Kiger'],
    'Kia': ['Seltos', 'Sonet', 'Carnival'],
    'MG': ['Hector', 'ZS EV', 'Astor', 'Gloster'],
    'Jeep': ['Compass', 'Wrangler', 'Meridian']
}

FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
TRANSMISSIONS = ['Manual', 'Automatic', 'AMT', 'CVT']
OWNER_TYPES = ['First Owner', 'Second Owner', 'Third Owner', 'Fourth & Above']
CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 
          'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi']

def generate_car_data(num_records=75000):
    """Generate synthetic used car dataset"""
    data = []
    
    for i in range(num_records):
        brand = random.choice(BRANDS)
        model = random.choice(MODELS[brand])
        year = random.randint(2010, 2024)
        age = 2024 - year
        
        # KMs driven based on age and usage
        base_kms = random.randint(5000, 20000) * age
        kms_driven = base_kms + random.randint(-10000, 20000)
        kms_driven = max(1000, min(kms_driven, 200000))
        
        fuel_type = random.choice(FUEL_TYPES)
        transmission = random.choice(TRANSMISSIONS)
        
        # Engine CC based on brand/model
        if brand in ['Maruti Suzuki', 'Hyundai'] and model in ['Alto', 'i10', 'Santro']:
            engine_cc = random.choice([796, 998, 1197])
        elif model in ['Swift', 'i20', 'Baleno']:
            engine_cc = random.choice([1197, 1248, 1498])
        elif model in ['Creta', 'Seltos', 'Nexon']:
            engine_cc = random.choice([1498, 1598, 1999])
        elif model in ['Scorpio', 'Fortuner', 'XUV500']:
            engine_cc = random.choice([2179, 2498, 2755])
        else:
            engine_cc = random.choice([1197, 1498, 1598, 1999])
        
        owner_type = random.choice(OWNER_TYPES)
        city = random.choice(CITIES)
        
        # Price calculation with depreciation and market factors
        base_price = calculate_base_price(brand, model, year, engine_cc, fuel_type)
        
        # Depreciation factors
        age_depreciation = 0.85 ** age  # 15% per year
        kms_depreciation = 1 - (kms_driven / 200000) * 0.3  # Max 30% for high kms
        owner_depreciation = {'First Owner': 1.0, 'Second Owner': 0.85, 
                             'Third Owner': 0.70, 'Fourth & Above': 0.55}[owner_type]
        fuel_depreciation = {'Petrol': 1.0, 'Diesel': 1.1, 'CNG': 0.9, 
                           'Electric': 1.2, 'Hybrid': 1.15}[fuel_type]
        transmission_factor = {'Manual': 1.0, 'Automatic': 1.15, 'AMT': 1.05, 'CVT': 1.1}[transmission]
        
        # City premium/discount
        city_factor = {'Mumbai': 1.1, 'Delhi': 1.05, 'Bangalore': 1.08, 
                      'Hyderabad': 1.0, 'Chennai': 0.95, 'Pune': 1.0,
                      'Kolkata': 0.92, 'Ahmedabad': 0.95, 'Jaipur': 0.90,
                      'Lucknow': 0.88, 'Chandigarh': 1.0, 'Kochi': 0.93}[city]
        
        price = base_price * age_depreciation * kms_depreciation * owner_depreciation * fuel_depreciation * transmission_factor * city_factor
        
        # Add random noise (±10%)
        price = price * random.uniform(0.90, 1.10)
        price = max(50000, min(price, 5000000))  # Min 50k, Max 50L
        
        data.append({
            'car_id': f'CAR{i+1:06d}',
            'brand': brand,
            'model': model,
            'year': year,
            'kms_driven': kms_driven,
            'fuel_type': fuel_type,
            'transmission': transmission,
            'owner_type': owner_type,
            'city': city,
            'price': round(price, 2)
        })
    
    return pd.DataFrame(data)

def calculate_base_price(brand, model, year, engine_cc, fuel_type):
    """Calculate base price for a new car"""
    # Base prices in lakhs (Indian market)
    brand_premium = {
        'Maruti Suzuki': 1.0, 'Hyundai': 1.1, 'Mahindra': 1.15,
        'Tata': 1.0, 'Honda': 1.2, 'Toyota': 1.3, 'Ford': 1.15,
        'Volkswagen': 1.25, 'Skoda': 1.3, 'Nissan': 1.1,
        'Renault': 1.0, 'Kia': 1.2, 'MG': 1.25, 'Jeep': 1.4
    }
    
    # Engine size factor
    engine_factor = engine_cc / 1200
    
    # Fuel type premium
    fuel_factor = {'Petrol': 1.0, 'Diesel': 1.1, 'CNG': 0.95, 
                   'Electric': 1.3, 'Hybrid': 1.25}[fuel_type]
    
    # Base price calculation
    base = 5 + (engine_factor * 3)  # 5-15 lakhs base
    base = base * brand_premium[brand] * fuel_factor
    
    # Year adjustment (newer cars cost more)
    year_factor = 1 + ((year - 2010) / 14) * 0.5
    
    return base * year_factor * 100000  # Convert to rupees

if __name__ == '__main__':
    print("Generating synthetic used car dataset...")
    df = generate_car_data(75000)
    
    # Save to CSV
    output_path = 'dataset/used_output_part1.csv'
    df.to_csv(output_path, index=False)
    
    print(f"Dataset generated successfully!")
    print(f"Total records: {len(df)}")
    print(f"Saved to: {output_path}")
    print("\nDataset Preview:")
    print(df.head(10))
    print("\nDataset Statistics:")
    print(df.describe())
    print("\nPrice Distribution:")
    print(f"Min: ₹{df['price'].min():,.2f}")
    print(f"Max: ₹{df['price'].max():,.2f}")
    print(f"Mean: ₹{df['price'].mean():,.2f}")
    print(f"Median: ₹{df['price'].median():,.2f}")

