/// <reference types="vite/client" />
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://used-car-backendd.onrender.com/api';

console.log('Frontend using API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface CarInput {
  brand: string;
  model: string;
  year: number;
  kms_driven: number;
  fuel_type: string;
  transmission: string;
  variant: string;
  body_type?: string;
  ex_showroom_price?: number;
  model_id?: number;
  owner_type: string;
  city: string;
  user_id?: number;
}

export interface PredictionResult {
  success: boolean;
  predicted_price: number;
  formatted_price: string;
  risk_level: string;
  risk_score: number;
  risk_formula: string;
  input_data: CarInput;
}

export interface PredictionHistory {
  success: boolean;
  predictions: any[];
  count: number;
}

export interface DatasetPreview {
  success: boolean;
  data: any[];
  total: number;
  limit: number;
  offset: number;
}

export interface DatasetStats {
  success: boolean;
  stats: {
    total_records: number;
    price_stats: {
      min: number;
      max: number;
      mean: number;
      median: number;
    };
    brand_distribution: Record<string, number>;
    model_distribution: Record<string, number>;
    variant_distribution: Record<string, number>;
    fuel_type_distribution: Record<string, number>;
    city_distribution: Record<string, number>;
    year_range: {
      min: number;
      max: number;
    };
    price_vs_year?: {
      year: number;
      avgPrice: number;
    }[];
  };
}

export interface ModelMetrics {
  success: boolean;
  metrics: {
    test_r2: number;
    test_rmse: number;
    test_mae: number;
    test_accuracy: number;
    train_r2: number;
    train_rmse: number;
    train_mae: number;
    train_accuracy: number;
    feature_importance?: Record<string, number>;
  };
}

export interface TrainingStatus {
  success: boolean;
  status: {
    active: boolean;
    progress: number;
    message: string;
    lastCompleted: string | null;
    error: string | null;
  };
}

// Prediction API
export const predictPrice = async (carData: CarInput): Promise<PredictionResult> => {
  const response = await api.post<PredictionResult>('/predict', carData);
  return response.data;
};

// History API
export const getPredictionHistory = async (limit = 50): Promise<PredictionHistory> => {
  const response = await api.get<PredictionHistory>(`/history?limit=${limit}`);
  return response.data;
};

// Dataset API
export const getDatasetPreview = async (limit = 100, offset = 0): Promise<DatasetPreview> => {
  const response = await api.get<DatasetPreview>(`/dataset/preview?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const getDatasetStats = async (): Promise<DatasetStats> => {
  const response = await api.get<DatasetStats>('/dataset/stats');
  return response.data;
};

export const downloadDataset = async (): Promise<Blob> => {
  const response = await api.get('/dataset/download', {
    responseType: 'blob'
  });
  return response.data;
};

export const uploadDataset = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/dataset/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Admin API
export const retrainModel = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/admin/retrain');
  return response.data;
};

export const getModelMetrics = async (): Promise<ModelMetrics> => {
  const response = await api.get<ModelMetrics>('/admin/metrics');
  return response.data;
};

export const getUsers = async (): Promise<{ success: boolean; users: any[] }> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const deleteUser = async (userId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getTrainingStatus = async (): Promise<TrainingStatus> => {
  const response = await api.get<TrainingStatus>('/admin/training-status');
  return response.data;
};

// Auth API
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.success && response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    // If axios error, extract the error message from response
    if (error.response?.data) {
      // Return the error response as if it was successful, but with success: false
      return error.response.data;
    }
    // If no response data, throw the error
    throw error;
  }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.success && response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    // If axios error, extract the error message from response
    if (error.response?.data) {
      // Return the error response as if it was successful, but with success: false
      return error.response.data;
    }
    // If no response data, throw the error
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<{ success: boolean; user: any }> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export default api;

