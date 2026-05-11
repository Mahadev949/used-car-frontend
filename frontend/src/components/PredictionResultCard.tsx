import { PredictionResult } from '../services/api';

interface PredictionResultCardProps {
  result: PredictionResult;
}

const PredictionResultCard = ({ result }: PredictionResultCardProps) => {
  return (
    <div className="bg-gradient-to-br from-secondary/20 to-accent/20 p-6 rounded-lg border border-secondary/30">
      <h3 className="text-xl font-semibold text-white mb-4">Predicted Price</h3>

      <div className="text-center">
        <div className="text-5xl font-bold text-secondary mb-2">
          {result.formatted_price}
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Based on {result.input_data.brand} {result.input_data.model} ({result.input_data.year})
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-400">KMs Driven:</span>
            <span className="text-white ml-2">
              {result.input_data?.kms_driven?.toLocaleString() ?? 0} km
            </span>
          </div>
          <div>
            <span className="text-gray-400">Fuel Type:</span>
            <span className="text-white ml-2">{result.input_data?.fuel_type ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Transmission:</span>
            <span className="text-white ml-2">{result.input_data?.transmission ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">City:</span>
            <span className="text-white ml-2">{result.input_data?.city ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Body Type:</span>
            <span className="text-white ml-2">{result.input_data?.body_type ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Owner:</span>
            <span className="text-white ml-2 capitalize">{result.input_data?.owner_type ?? 'N/A'}</span>
          </div>
          <div className="col-span-2 text-center border-t border-secondary/20 pt-2 mt-2">
            <span className="text-gray-400">Ex-showroom Price:</span>
            <span className="text-secondary font-semibold ml-2 text-lg">
              {result.input_data?.ex_showroom_price
                ? `₹${result.input_data.ex_showroom_price.toLocaleString('en-IN')}`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResultCard;

