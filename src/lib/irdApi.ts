import { getIRDAuthToken } from './irdAuth';
import { IRD_API_CONFIG } from '../config/irdApi';

// IRD API Response Types
interface IRDApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

// IRD Filing Types
interface IR348Filing {
  header: {
    irdNumber: string;
    period: {
      startDate: string;
      endDate: string;
    };
    totalPaye: number;
    totalGross: number;
    employeeCount: number;
  };
  employees: Array<{
    irdNumber: string;
    name: string;
    taxCode: string;
    grossEarnings: number;
    payeDeducted: number;
    kiwiSaverDeductions: number;
  }>;
}

export class IRDApiClient {
  private rateLimiter = {
    tokens: 100,
    lastRefill: Date.now(),
    refillRate: 10, // tokens per second
    refillInterval: 1000 // 1 second
  };

  private async checkRateLimit() {
    const now = Date.now();
    const timePassed = now - this.rateLimiter.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.rateLimiter.refillInterval) * this.rateLimiter.refillRate;
    
    if (tokensToAdd > 0) {
      this.rateLimiter.tokens = Math.min(100, this.rateLimiter.tokens + tokensToAdd);
      this.rateLimiter.lastRefill = now;
    }

    if (this.rateLimiter.tokens < 1) {
      throw new Error('Rate limit exceeded');
    }

    this.rateLimiter.tokens--;
  }

  private async request<T>(
    endpoint: string,
    method: string,
    data?: any,
    options: { skipAuth?: boolean } = {}
  ): Promise<IRDApiResponse<T>> {
    await this.checkRateLimit();

    let attempt = 0;
    while (attempt < IRD_API_CONFIG.retryAttempts) {
      try {
        const token = options.skipAuth ? null : await getIRDAuthToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-IRD-Filing-Version': '2024.1',
          'X-Request-ID': crypto.randomUUID()
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${IRD_API_CONFIG.baseUrl}/${IRD_API_CONFIG.version}${endpoint}`, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(IRD_API_CONFIG.timeout)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `IRD API error: ${response.status}`);
        }

        const result = await response.json();
        return { success: true, data: result };
      } catch (error) {
        attempt++;
        if (attempt === IRD_API_CONFIG.retryAttempts) {
          return {
            success: false,
            error: {
              code: 'API_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
              details: `Failed after ${attempt} attempts`
            }
          };
        }
        // Exponential backoff with jitter
        const delay = Math.min(
          IRD_API_CONFIG.retryDelay * Math.pow(2, attempt) * (0.5 + Math.random()),
          IRD_API_CONFIG.maxRetryDelay
        );
        await new Promise(r => setTimeout(r, delay));
      }
    }

    return {
      success: false,
      error: {
        code: 'MAX_RETRIES',
        message: 'Maximum retry attempts reached'
      }
    };
  }

  // Submit IR348 (PAYE) filing
  async submitIR348(filing: IR348Filing): Promise<IRDApiResponse<any>> {
    // In development mode, simulate successful submission
    if (IRD_API_CONFIG.isDevelopment) {
      return {
        success: true,
        data: {
          filingId: `mock_${Date.now()}`,
          status: 'submitted',
          timestamp: new Date().toISOString()
        }
      };
    }
    return this.request('/filings/ir348', 'POST', filing);
  }

  // Get filing status
  async getFilingStatus(filingId: string): Promise<IRDApiResponse<any>> {
    // In development mode, simulate status check
    if (IRD_API_CONFIG.isDevelopment) {
      return {
        success: true,
        data: {
          status: Math.random() > 0.5 ? 'accepted' : 'pending',
          timestamp: new Date().toISOString()
        }
      };
    }
    return this.request(`/filings/${filingId}/status`, 'GET');
  }

  // Get filing history
  async getFilingHistory(
    startDate: string,
    endDate: string
  ): Promise<IRDApiResponse<any>> {
    return this.request(
      `/filings/history?startDate=${startDate}&endDate=${endDate}`,
      'GET'
    );
  }
}

// Export singleton instance
export const irdApi = new IRDApiClient();