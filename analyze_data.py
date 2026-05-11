
import pandas as pd
import glob
import os

def analyze_correlation():
    dataset_dir = 'ml/dataset'
    csv_files = glob.glob(os.path.join(dataset_dir, 'used_output_part*.csv'))
    
    if not csv_files:
        print("No dataset files found!")
        return
        
    all_correlations = []
    
    for f in csv_files:
        df = pd.read_csv(f)
        if 'total_kms' in df.columns and 'used_price' in df.columns:
            # Drop rows with NaN if any
            temp_df = df[['total_kms', 'used_price']].dropna()
            corr = temp_df['total_kms'].corr(temp_df['used_price'])
            print(f"File: {os.path.basename(f)} | Correlation (total_kms vs used_price): {corr:.4f}")
            all_correlations.append(corr)
        else:
            print(f"File: {os.path.basename(f)} | Missing required columns.")

    if all_correlations:
        avg_corr = sum(all_correlations) / len(all_correlations)
        print(f"\nAverage Correlation: {avg_corr:.4f}")
        
        if avg_corr > 0:
            print("WARNING: Positive correlation detected! More kms = higher price.")
        else:
            print("INFO: Negative correlation detected as expected.")

if __name__ == '__main__':
    analyze_correlation()
