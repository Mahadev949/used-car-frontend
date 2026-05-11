import pandas as pd
import numpy as np
import glob
import os
import json

def calculate_full_stats(dataset_dir='ml/dataset'):
    print("Finding dataset parts...")
    csv_files = glob.glob(os.path.join(dataset_dir, 'used_output_part*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {dataset_dir}!")
        return

    print(f"Found {len(csv_files)} files.")
    
    total_records = 0
    price_total = 0
    price_min = float('inf')
    price_max = float('-inf')
    
    brand_dist = {}
    model_dist = {}
    fuel_dist = {}
    city_dist = {}
    year_dist = {}
    year_prices = {} # New: stores {year: [total_price, count]}
    
    # We can't load all at once for median, so we'll collect a sample for median/distributions 
    # but exact counts for everything else.
    # For a dataset this size, we can use a reservoir sample or just a large fixed sample for the median.
    all_prices = []
    sample_rate = 0.05 # 5% sample for median and distribution details if needed, 
                       # but 10.8M * 0.05 is still ~540k, which is fine in memory.

    for f in csv_files:
        print(f"Processing {os.path.basename(f)}...")
        # Use chunking to be memory safe even if one file is huge
        for chunk in pd.read_csv(f, chunksize=100000):
            total_records += len(chunk)
            
            # Numeric stats
            prices = chunk['used_price'].dropna()
            if not prices.empty:
                price_total += prices.sum()
                price_min = min(price_min, prices.min())
                price_max = max(price_max, prices.max())
                
                # Sample for median
                sample = prices.sample(frac=sample_rate)
                all_prices.extend(sample.tolist())

            # Year-wise price aggregation
            if 'Year' in chunk.columns and 'used_price' in chunk.columns:
                year_chunk_stats = chunk.groupby('Year')['used_price'].agg(['sum', 'count']).to_dict('index')
                for year, year_stats in year_chunk_stats.items():
                    y_str = str(int(year))
                    if y_str not in year_prices:
                        year_prices[y_str] = [0, 0]
                    year_prices[y_str][0] += year_stats['sum']
                    year_prices[y_str][1] += year_stats['count']

            # Distribution stats (using value_counts on chunks)
            for col, dist in [('Company', brand_dist), ('Model', model_dist), 
                               ('Fuel', fuel_dist), ('city', city_dist), ('Year', year_dist)]:
                if col in chunk.columns:
                    counts = chunk[col].value_counts()
                    for val, count in counts.items():
                        dist[str(val)] = dist.get(str(val), 0) + int(count)

    print("Finalizing statistics...")
    
    # Calculate year-wise averages
    price_vs_year = []
    for year in sorted(year_prices.keys()):
        total, count = year_prices[year]
        price_vs_year.append({
            'year': int(year),
            'avgPrice': float(total / count) if count > 0 else 0
        })
    
    # Calculate median from collected samples
    median_price = np.median(all_prices) if all_prices else 0
    mean_price = price_total / total_records if total_records > 0 else 0
    
    years = [int(y) for y in year_dist.keys()]
    
    stats = {
        'total_records': total_records,
        'price_stats': {
            'min': float(price_min),
            'max': float(price_max),
            'mean': float(mean_price),
            'median': float(median_price)
        },
        'brand_distribution': brand_dist,
        'model_distribution': model_dist,
        'fuel_type_distribution': fuel_dist,
        'city_distribution': city_dist,
        'year_range': {
            'min': min(years) if years else 0,
            'max': max(years) if years else 0
        },
        'price_vs_year': price_vs_year
    }
    
    output_path = 'ml/dataset_stats.json'
    with open(output_path, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"Full statistics saved to {output_path}")
    print(f"Total Records: {total_records}")

if __name__ == '__main__':
    # Ensure current directory is project root
    calculate_full_stats()
