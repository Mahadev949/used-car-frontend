
import json
import os
import sys

# Add the ml directory to sys.path
sys.path.append(os.path.abspath('ml'))

from predict import predict_price

def test_kms_correlation():
    test_configs = [
        {
            'Company': 'Maruti Suzuki',
            'Model': 'Swift',
            'Year': 2020,
            'Model_ID': 1,
            'Variant': 'VXI',
            'Fuel': 'Petrol',
            'Transmission': 'Manual',
            'Body_Type': 'Hatchback',
            'Ex_Showroom_Price': 600000,
            'city': 'mumbai',
            'owner_type': 'first owner'
        },
        {
            'Company': 'Hyundai',
            'Model': 'Creta',
            'Year': 2018,
            'Model_ID': 10,
            'Variant': 'SX',
            'Fuel': 'Diesel',
            'Transmission': 'Manual',
            'Body_Type': 'SUV',
            'Ex_Showroom_Price': 1500000,
            'city': 'delhi',
            'owner_type': 'second owner'
        }
    ]

    kms_values = [5000, 10000, 20000, 40000, 80000, 120000, 200000]
    
    for config in test_configs:
        print(f"\nTesting for {config['Company']} {config['Model']} ({config['Year']})")
        print(f"{'KMs Driven':<15} | {'Predicted Price':<20}")
        print("-" * 40)
        
        last_price = None
        for kms in kms_values:
            data = config.copy()
            data['total_kms'] = kms
            result = predict_price(data, model_path='ml/price_model.pkl')
            if result['success']:
                price = result['predicted_price']
                trend = ""
                if last_price is not None:
                    if price > last_price:
                        trend = " (INCREASED!)"
                    elif price < last_price:
                        trend = " (Decreased)"
                    else:
                        trend = " (No change)"
                print(f"{kms:<15} | INR {price:,.2f}{trend}")
                last_price = price
            else:
                print(f"{kms:<15} | Error: {result['error']}")

if __name__ == '__main__':
    test_kms_correlation()
