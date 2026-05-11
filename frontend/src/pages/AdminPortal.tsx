import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getModelMetrics, retrainModel, getUsers, deleteUser, getTrainingStatus, ModelMetrics, TrainingStatus } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminPortal = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus['status'] | null>(null);

  useEffect(() => {
    loadData();
    // Check initial training status
    checkTrainingStatus();
  }, []);

  // Poll for status if retraining is active
  useEffect(() => {
    let interval: any;
    if (retraining || (trainingStatus?.active)) {
      interval = setInterval(async () => {
        await checkTrainingStatus();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [retraining, trainingStatus?.active]);

  const checkTrainingStatus = async () => {
    try {
      const statusData = await getTrainingStatus();
      setTrainingStatus(statusData.status);

      // If was active but now not active and no error, reload metrics
      if (retraining && !statusData.status.active && !statusData.status.error) {
        setRetraining(false);
        // Add a 3s delay to ensure DB and Filesystem are in sync
        setTimeout(async () => {
          await loadData();
          alert('Model retraining completed and metrics updated!');
        }, 3000);
      } else if (statusData.status.active) {
        setRetraining(true);
      } else if (!statusData.status.active) {
        setRetraining(false);
      }
    } catch (err) {
      console.error('Failed to check training status:', err);
    }
  };

  const loadData = async () => {
    try {
      const [metricsData, usersData] = await Promise.all([
        getModelMetrics(),
        getUsers(),
      ]);
      setMetrics(metricsData);
      setUsers(usersData.users);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Delete user "${username}" and ALL their data (predictions, dealer info)? This cannot be undone.`)) {
      return;
    }
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        alert(`User "${username}" deleted successfully.`);
      } else {
        alert(result.error || 'Failed to delete user.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error deleting user.');
    }
  };

  const handleRetrain = async () => {
    if (!confirm('Are you sure you want to retrain the model? This may take several minutes.')) {
      return;
    }
    setRetraining(true);
    try {
      await retrainModel();
      // Start polling immediately
      await checkTrainingStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start retraining. Please check backend logs.');
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-300">Loading admin data...</div>
      </div>
    );
  }

  const featureImportanceData = metrics?.metrics?.feature_importance
    ? Object.entries(metrics.metrics.feature_importance)
      .map(([feature, importance]) => ({ feature, importance }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
      <p className="text-gray-300 mb-8">Model management, dataset control, and user administration</p>

      {/* Model Metrics */}
      {metrics && (
        <div className="mb-8">
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Model Performance Metrics</h2>
              <div className="flex space-x-4">
                <Link
                  to="/datascience"
                  className="bg-secondary text-primary px-6 py-2 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
                >
                  Data Science Portal
                </Link>
                <button
                  onClick={handleRetrain}
                  disabled={retraining || trainingStatus?.active}
                  className="bg-accent text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {retraining ? 'Retraining...' : 'Retrain Model'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {(retraining || trainingStatus?.active) && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-accent font-medium">{trainingStatus?.message || 'Processing...'}</span>
                  <span className="text-accent font-bold">{trainingStatus?.progress || 0}%</span>
                </div>
                <div className="w-full bg-primary/30 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-500 ease-out"
                    style={{ width: `${trainingStatus?.progress || 0}%` }}
                  ></div>
                </div>
                {trainingStatus?.error && (
                  <p className="text-red-400 mt-2 text-sm">Error: {trainingStatus.error}</p>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Test R² Score</p>
                <p className="text-3xl font-bold text-secondary">
                  {metrics.metrics.test_r2?.toFixed(4) || '0.0000'}
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Test Accuracy</p>
                <p className="text-3xl font-bold text-secondary">
                  {((metrics.metrics.test_accuracy || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Test RMSE</p>
                <p className="text-3xl font-bold text-secondary">
                  ₹{metrics.metrics.test_rmse?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Test MAE</p>
                <p className="text-3xl font-bold text-secondary">
                  ₹{metrics.metrics.test_mae?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Train R² Score</p>
                <p className="text-2xl font-bold text-accent">
                  {metrics.metrics.train_r2?.toFixed(4) || '0.0000'}
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Train Accuracy</p>
                <p className="text-2xl font-bold text-accent">
                  {((metrics.metrics.train_accuracy || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Train RMSE</p>
                <p className="text-2xl font-bold text-accent">
                  ₹{metrics.metrics.train_rmse?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
              <div className="bg-primary/50 p-4 rounded border border-secondary/10">
                <p className="text-gray-400 text-sm">Train MAE</p>
                <p className="text-2xl font-bold text-accent">
                  ₹{metrics.metrics.train_mae?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Importance */}
          {featureImportanceData.length > 0 && (
            <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
              <h2 className="text-2xl font-semibold text-white mb-4">Top 10 Feature Importance</h2>
              <div className="h-96">
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
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff' }}
                    />
                    <Bar dataKey="importance" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Management */}
      <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
        <h2 className="text-2xl font-semibold text-white mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-secondary/20">
                <th className="pb-2 text-gray-300">ID</th>
                <th className="pb-2 text-gray-300">Username</th>
                <th className="pb-2 text-gray-300">Email</th>
                <th className="pb-2 text-gray-300">Role</th>
                <th className="pb-2 text-gray-300">Created</th>
                <th className="pb-2 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-secondary/10 hover:bg-secondary/5 transition-colors">
                  <td className="py-2 text-white">{user.id}</td>
                  <td className="py-2 text-white">{user.username}</td>
                  <td className="py-2 text-gray-300">{user.email}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${user.role === 'admin'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-secondary/20 text-secondary'
                        }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 hover:text-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;

