import { useState, useEffect, FormEvent } from 'react';
import { CarInput } from '../services/api';

interface PredictionFormProps {
  onSubmit: (data: CarInput) => void;
  loading: boolean;
  initialData?: Partial<CarInput> | null;
}

const OWNER_TYPES = ['first owner', 'second owner', 'third owner', 'fourth owner'];
const CITIES = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune',
  'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'kochi'];

const PredictionForm = ({ onSubmit, loading, initialData }: PredictionFormProps) => {
  const [variantsData, setVariantsData] = useState<Record<string, any>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  const [formData, setFormData] = useState<CarInput>({
    brand: '',
    model: '',
    variant: '',
    year: new Date().getFullYear(),
    kms_driven: 0,
    fuel_type: '',
    transmission: '',
    owner_type: 'first owner',
    city: 'mumbai',
    model_id: 0,
    body_type: '',
    ex_showroom_price: 0
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableVariants, setAvailableVariants] = useState<string[]>([]);
  const [availableFuels, setAvailableFuels] = useState<string[]>([]);
  const [availableTransmissions, setAvailableTransmissions] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (initialData && dataLoaded) {
      const brand = initialData.brand || '';
      const model = initialData.model || '';
      const variant = initialData.variant || '';

      const models = Object.keys(variantsData[brand] || {}).sort();
      const variants = Object.keys(variantsData[brand]?.[model] || {}).sort();
      const variantInfo = variantsData[brand]?.[model]?.[variant];

      setAvailableModels(models);
      setAvailableVariants(variants);

      if (variantInfo) {
        setAvailableFuels(variantInfo.fuel);
        setAvailableTransmissions(variantInfo.transmission);
        setAvailableYears(variantInfo.years);
      }

      setFormData({
        brand,
        model,
        variant,
        year: initialData.year || new Date().getFullYear(),
        kms_driven: initialData.kms_driven || 0,
        fuel_type: initialData.fuel_type || '',
        transmission: initialData.transmission || '',
        owner_type: initialData.owner_type || 'first owner',
        city: initialData.city || 'mumbai',
        model_id: initialData.model_id || variantInfo?.model_id || 0,
        body_type: initialData.body_type || variantInfo?.body_type || '',
        ex_showroom_price: initialData.ex_showroom_price || variantInfo?.ex_showroom_price || 0
      });
    }
  }, [initialData, dataLoaded, variantsData]);

  useEffect(() => {
    const loadVariants = async () => {
      try {
        const response = await fetch('/data/variants_data.json');
        const data = await response.json();
        setVariantsData(data);
        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load variants data:', err);
      }
    };
    loadVariants();
  }, []);

  const brands = Object.keys(variantsData).sort();

  const handleBrandChange = (brand: string) => {
    setFormData({
      ...formData,
      brand,
      model: '',
      variant: '',
      fuel_type: '',
      transmission: '',
      year: new Date().getFullYear()
    });
    setAvailableModels(Object.keys(variantsData[brand] || {}).sort());
    setAvailableVariants([]);
  };

  const handleModelChange = (model: string) => {
    setFormData({
      ...formData,
      model,
      variant: '',
      fuel_type: '',
      transmission: '',
      year: new Date().getFullYear()
    });
    setAvailableVariants(Object.keys(variantsData[formData.brand]?.[model] || {}).sort());
  };

  const handleVariantChange = (variant: string) => {
    const variantInfo = variantsData[formData.brand]?.[formData.model]?.[variant];
    if (variantInfo) {
      setFormData({
        ...formData,
        variant,
        fuel_type: variantInfo.fuel[0] || '',
        transmission: variantInfo.transmission[0] || '',
        year: variantInfo.years[variantInfo.years.length - 1] || new Date().getFullYear(),
        model_id: variantInfo.model_id,
        body_type: variantInfo.body_type,
        ex_showroom_price: variantInfo.ex_showroom_price
      });
      setAvailableFuels(variantInfo.fuel);
      setAvailableTransmissions(variantInfo.transmission);
      setAvailableYears(variantInfo.years);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    if (!formData.brand || !formData.model || !formData.variant || !formData.fuel_type || !formData.transmission) {
      alert('Please select all required fields (Brand, Model, Variant, Fuel, Transmission)');
      return;
    }
    onSubmit(formData);
  };

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8 bg-secondary/5 rounded-lg border border-secondary/10">
        <div className="text-secondary animate-pulse">Initializing car data...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Brand</label>
          <select
            value={formData.brand}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
          >
            <option value="">Select Brand</option>
            {brands.map((brandName) => (
              <option key={brandName} value={brandName}>{brandName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
          <select
            value={formData.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
            disabled={!formData.brand}
          >
            <option value="">Select Model</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Variant</label>
          <select
            value={formData.variant}
            onChange={(e) => handleVariantChange(e.target.value)}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
            disabled={!formData.model}
          >
            <option value="">Select Variant</option>
            {availableVariants.map((variant) => (
              <option key={variant} value={variant}>{variant}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
          <select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
            disabled={!formData.variant}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">KMs Driven</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 45000"
            value={formData.kms_driven || ''}
            onChange={(e) => setFormData({ ...formData, kms_driven: parseInt(e.target.value) || 0 })}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Fuel Type</label>
          <select
            value={formData.fuel_type}
            onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
            disabled={!formData.variant}
          >
            {availableFuels.map((fuel) => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Transmission</label>
          <select
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
            disabled={!formData.variant}
          >
            {availableTransmissions.map((trans) => (
              <option key={trans} value={trans}>{trans}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Owner Type</label>
          <select
            value={formData.owner_type}
            onChange={(e) => setFormData({ ...formData, owner_type: e.target.value })}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
          >
            {OWNER_TYPES.map((owner) => (
              <option key={owner} value={owner}>
                {owner.charAt(0).toUpperCase() + owner.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
          <select
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
            required
          >
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city.charAt(0).toUpperCase() + city.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary text-primary py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Predicting...' : 'Predict Price'}
      </button>
    </form>
  );
};

export default PredictionForm;

