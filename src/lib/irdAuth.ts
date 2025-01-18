import { IRD_API_CONFIG } from '../config/irdApi';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

export async function getIRDAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && tokenExpiry > new Date()) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${IRD_API_CONFIG.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: IRD_API_CONFIG.clientId!,
        client_secret: IRD_API_CONFIG.clientSecret!,
        scope: IRD_API_CONFIG.scopes.join(' ')
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get auth token: ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();
    
    // Cache token
    cachedToken = data.access_token;
    tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

    return data.access_token;
  } catch (error) {
    console.error('Error getting IRD auth token:', error);
    throw new Error('Failed to authenticate with IRD');
  }
}