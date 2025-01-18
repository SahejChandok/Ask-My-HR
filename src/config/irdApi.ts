import { isDevelopment } from '../utils/environment';

export const IRD_API_CONFIG = {
  baseUrl: import.meta.env.VITE_IRD_API_URL || 'https://api.ird.govt.nz/gateway',
  version: 'v1',
  clientId: import.meta.env.VITE_IRD_CLIENT_ID,
  clientSecret: import.meta.env.VITE_IRD_CLIENT_SECRET,
  scopes: ['ir348.submit', 'ir348.read'],
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetryDelay: 5000,
  isDevelopment: isDevelopment()
};