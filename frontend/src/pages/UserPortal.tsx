import { useState, useEffect } from 'react';
import { predictPrice, getPredictionHistory, CarInput, PredictionResult } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PredictionForm from '../components/PredictionForm';
import PredictionResultCard from '../components/PredictionResultCard';
import HistoryChart from '../components/HistoryChart';

const UserPortal = () => {
  const { user } = useAuth();
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<Partial<CarInput> | null>(null);

  const handlePredict = async (carData: CarInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await predictPrice({ ...carData, user_id: user?.id });
      setPredictionResult(result);
      // Refresh history
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (pred: any) => {
    setSelectedCar({
      brand: pred.brand,
      model: pred.model,
      variant: pred.variant,
      year: pred.year,
      kms_driven: pred.kms_driven,
      fuel_type: pred.fuel_type,
      transmission: pred.transmission,
      owner_type: pred.owner_type,
      city: pred.city,
      body_type: pred.body_type,
      model_id: pred.model_id,
      ex_showroom_price: pred.ex_showroom_price
    });
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const historyData = await getPredictionHistory();
      setHistory(historyData.predictions);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-2">User Portal</h1>
      <p className="text-gray-300 mb-8">Get instant price predictions for your used car</p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Prediction Form */}
        <div>
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Car Details</h2>
            <PredictionForm onSubmit={handlePredict} loading={loading} initialData={selectedCar} />
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Prediction Result */}
          {predictionResult && (
            <div className="mt-6">
              <PredictionResultCard result={predictionResult} />
            </div>
          )}
        </div>

        {/* History & Charts */}
        <div>
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Prediction History</h2>
            {history.length > 0 ? (
              <>
                <HistoryChart data={history} />
                <div className="mt-4 max-h-96 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {history.slice(0, 10).map((pred, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleHistoryClick(pred)}
                        className="bg-primary/50 p-3 rounded border border-secondary/10 hover:border-secondary/40 hover:bg-primary/70 cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">
                              {pred.brand} {pred.model} {pred.variant} ({pred.year})
                            </p>
                            <p className="text-gray-400 text-sm">
                              {pred.kms_driven.toLocaleString()} km • {pred.city} • {pred.body_type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-secondary font-semibold">
                              ₹{parseFloat(pred.predicted_price).toLocaleString('en-IN', {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {new Date(pred.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400">No prediction history yet. Make your first prediction!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPortal;

