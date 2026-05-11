import { useState, useEffect, useRef } from 'react';
import { getDatasetStats, DatasetStats, downloadDataset, uploadDataset } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DealerPortal = () => {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDatasetStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleDownloadCSV = async () => {
    try {
      const blob = await downloadDataset();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dataset_all.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download dataset. Please try again.');
    }
  };

  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadDataset(file);
      alert(result.message);
      loadStats(); // Refresh stats
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-300">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-300">Failed to load analytics</div>
      </div>
    );
  }

  const brandData = Object.entries(stats.stats.brand_distribution)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const fuelData = Object.entries(stats.stats.fuel_type_distribution).map(([fuel, count]) => ({
    fuel,
    count,
  }));

  const cityData = Object.entries(stats.stats.city_distribution)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-2">Dealer Portal</h1>
      <p className="text-gray-300 mb-8">Market analytics, trends, and bulk car management</p>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
          <p className="text-gray-400 text-sm">Total Records</p>
          <p className="text-2xl font-bold text-secondary">
            {stats.stats.total_records.toLocaleString()}
          </p>
        </div>
        <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
          <p className="text-gray-400 text-sm">Avg Price</p>
          <p className="text-2xl font-bold text-secondary">
            ₹{stats.stats.price_stats.mean.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
          <p className="text-gray-400 text-sm">Min Price</p>
          <p className="text-2xl font-bold text-accent">
            ₹{stats.stats.price_stats.min.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
          <p className="text-gray-400 text-sm">Max Price</p>
          <p className="text-2xl font-bold text-accent">
            ₹{stats.stats.price_stats.max.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Brand Distribution */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Top Brands (Market Share)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                <XAxis dataKey="brand" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="count" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Type Distribution */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Fuel Type Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                <XAxis dataKey="fuel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Distribution */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <h2 className="text-2xl font-semibold text-white mb-4">City-wise Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                <XAxis dataKey="city" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bulk Upload Section */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Bulk Car Upload</h2>
          <p className="text-gray-300 mb-4">
            Upload multiple cars at once using CSV format. Download template below.
          </p>
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleUploadCSV}
            />
            <button
              onClick={handleDownloadCSV}
              className="w-full bg-secondary text-primary py-2 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              Download All CSV Data
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload CSV File'}
            </button>
          </div>
          <div className="mt-4 p-3 bg-primary/50 rounded border border-secondary/10">
            <p className="text-sm text-gray-400">
              CSV Format: brand, model, year, kms_driven, fuel_type, transmission, owner_type, city, price
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerPortal;

