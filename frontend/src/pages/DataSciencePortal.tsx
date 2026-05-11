import { useState, useEffect } from 'react';
import { getDatasetPreview, getDatasetStats, getModelMetrics, DatasetPreview, DatasetStats, ModelMetrics } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';

const DataSciencePortal = () => {
  const [dataset, setDataset] = useState<DatasetPreview | null>(null);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadPage();
    }
  }, [page]);

  const initialLoad = async () => {
    try {
      const [statsData, metricsData, datasetData] = await Promise.all([
        getDatasetStats(),
        getModelMetrics(),
        getDatasetPreview(pageSize, page * pageSize),
      ]);
      setStats(statsData);
      setMetrics(metricsData);
      setDataset(datasetData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoadingPage(true);
      const datasetData = await getDatasetPreview(pageSize, page * pageSize);
      setDataset(datasetData);
    } catch (err) {
      console.error('Failed to load page:', err);
    } finally {
      setLoadingPage(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-300">Loading dataset and metrics...</div>
      </div>
    );
  }

  // Prepare visualization data
  const priceVsYearData = stats?.stats?.price_vs_year || (dataset?.data
    ? Object.values(
      dataset.data.reduce((acc: any, car: any) => {
        const year = parseInt(car.year);
        if (!acc[year]) {
          acc[year] = { year, prices: [] };
        }
        acc[year].prices.push(parseFloat(car.price));
        return acc;
      }, {})
    ).map((item: any) => ({
      year: item.year,
      avgPrice: item.prices.reduce((a: number, b: number) => a + b, 0) / item.prices.length,
    }))
    : []);

  const priceVsKmsData = dataset?.data
    .map((car: any) => ({
      kms: parseInt(car.kms_driven),
      price: parseFloat(car.price),
    }))
    .slice(0, 100) || [];

  const featureImportanceData = metrics?.metrics?.feature_importance
    ? Object.entries(metrics.metrics.feature_importance)
      .map(([feature, importance]) => ({ feature, importance }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 15)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-2">Data Science Portal</h1>
      <p className="text-gray-300 mb-8">
        Dataset exploration, feature analysis, correlation matrices, and model evaluation
      </p>

      {/* Dataset Overview */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
            <p className="text-gray-400 text-sm">Total Records</p>
            <p className="text-2xl font-bold text-secondary">
              {stats.stats.total_records.toLocaleString()}
            </p>
          </div>
          <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
            <p className="text-gray-400 text-sm">Mean Price</p>
            <p className="text-2xl font-bold text-secondary">
              ₹{stats.stats.price_stats.mean.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
            <p className="text-gray-400 text-sm">Median Price</p>
            <p className="text-2xl font-bold text-accent">
              ₹{stats.stats.price_stats.median.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
            <p className="text-gray-400 text-sm">Year Range</p>
            <p className="text-2xl font-bold text-accent">
              {stats.stats.year_range.min} - {stats.stats.year_range.max}
            </p>
          </div>
        </div>
      )}

      {/* Visualizations */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Price vs Year */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Price vs Year (Average)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceVsYearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Avg Price']}
                />
                <Bar dataKey="avgPrice" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price vs KMs */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Price vs Kilometers Driven</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={priceVsKmsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="kms"
                  name="KMs"
                  stroke="#94a3b8"
                  label={{ value: 'Kilometers Driven', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  stroke="#94a3b8"
                  label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Scatter name="Cars" dataKey="price" fill="#22c55e">
                  {priceVsKmsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#22c55e" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Type Distribution */}
        {stats && (
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Fuel Type Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(stats.stats.fuel_type_distribution).map(([fuel, count]) => ({
                    fuel,
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                  <XAxis dataKey="fuel" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Feature Importance */}
        {featureImportanceData.length > 0 && (
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Feature Importance Ranking</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureImportanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={200} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="importance" fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Model Metrics */}
      {metrics && (
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Model Evaluation Metrics</h2>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-secondary mb-3">Test Metrics (Unseen Data)</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">R² Score</p>
                <p className="text-3xl font-bold text-secondary">{metrics.metrics.test_r2?.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Accuracy</p>
                <p className="text-3xl font-bold text-secondary">
                  {((metrics.metrics.test_accuracy || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">RMSE</p>
                <p className="text-3xl font-bold text-secondary">
                  ₹{metrics.metrics.test_rmse?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">MAE</p>
                <p className="text-3xl font-bold text-secondary">
                  ₹{metrics.metrics.test_mae?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-accent mb-3">Train Metrics (Learning Data)</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">R² Score</p>
                <p className="text-3xl font-bold text-accent">{metrics.metrics.train_r2?.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Accuracy</p>
                <p className="text-3xl font-bold text-accent">
                  {((metrics.metrics.train_accuracy || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">RMSE</p>
                <p className="text-3xl font-bold text-accent">
                  ₹{metrics.metrics.train_rmse?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">MAE</p>
                <p className="text-3xl font-bold text-accent">
                  ₹{metrics.metrics.train_mae?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview */}
      {dataset && (
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 relative">
          {loadingPage && (
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-2"></div>
                <p className="text-secondary font-semibold">Loading page...</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Dataset Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="bg-secondary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= (dataset.total || 0)}
                className="bg-secondary text-primary px-4 py-2 rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, dataset.total || 0)} of{' '}
            {dataset.total} records
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-secondary/20">
                  <th className="pb-2 text-gray-300">Car ID</th>
                  <th className="pb-2 text-gray-300">Brand</th>
                  <th className="pb-2 text-gray-300">Model</th>
                  <th className="pb-2 text-gray-300">Variant</th>
                  <th className="pb-2 text-gray-300">Year</th>
                  <th className="pb-2 text-gray-300">KMs</th>
                  <th className="pb-2 text-gray-300">Fuel</th>
                  <th className="pb-2 text-gray-300">Price</th>
                </tr>
              </thead>
              <tbody>
                {dataset.data.map((car: any, idx: number) => (
                  <tr key={idx} className="border-b border-secondary/10">
                    <td className="py-2 text-white">{car.car_id}</td>
                    <td className="py-2 text-white">{car.brand}</td>
                    <td className="py-2 text-white">{car.model}</td>
                    <td className="py-2 text-gray-300">{car.variant}</td>
                    <td className="py-2 text-gray-300">{car.year}</td>
                    <td className="py-2 text-gray-300">{parseInt(car.kms_driven).toLocaleString()}</td>
                    <td className="py-2 text-gray-300">{car.fuel_type}</td>
                    <td className="py-2 text-secondary font-semibold">
                      ₹{parseFloat(car.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSciencePortal;

