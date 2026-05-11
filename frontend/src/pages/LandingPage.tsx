import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Smart Used Car Price Prediction
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Powered by Machine Learning & Random Forest Algorithm
              <br />
              Get accurate, transparent price estimates for your used car
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/user"
                className="bg-secondary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
              >
                Get Price Prediction
              </Link>
              {isAdmin && (
                <Link
                  to="/datascience"
                  className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
                >
                  Explore Dataset
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">Accurate Predictions</h3>
            <p className="text-gray-300">
              Machine Learning model trained on 75,000+ car records for precise price estimation
            </p>
          </div>
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">Data Analytics</h3>
            <p className="text-gray-300">
              Comprehensive dashboards with market trends, price comparisons, and visualizations
            </p>
          </div>
          <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Transparent AI</h3>
            <p className="text-gray-300">
              Feature importance analysis and model metrics for complete transparency
            </p>
          </div>
        </div>
      </div>

      {/* Portals Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Access Portals</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/user"
            className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 hover:border-secondary transition-colors"
          >
            <h3 className="text-lg font-semibold text-secondary mb-2">👤 User Portal</h3>
            <p className="text-gray-300 text-sm">
              Get instant price predictions and view your prediction history
            </p>
          </Link>
          <Link
            to="/dealer"
            className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 hover:border-secondary transition-colors"
          >
            <h3 className="text-lg font-semibold text-secondary mb-2">🏪 Dealer Portal</h3>
            <p className="text-gray-300 text-sm">
              Bulk upload cars, view market analytics and demand trends
            </p>
          </Link>
          <Link
            to="/admin"
            className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 hover:border-secondary transition-colors"
          >
            <h3 className="text-lg font-semibold text-secondary mb-2">⚙️ Admin Portal</h3>
            <p className="text-gray-300 text-sm">
              Manage dataset, retrain model, monitor accuracy metrics
            </p>
          </Link>
          {isAdmin && (
            <Link
              to="/datascience"
              className="bg-secondary/10 p-6 rounded-lg border border-secondary/20 hover:border-secondary transition-colors"
            >
              <h3 className="text-lg font-semibold text-secondary mb-2">🔬 Data Science</h3>
              <p className="text-gray-300 text-sm">
                Explore dataset, view correlations, feature importance, model metrics
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

