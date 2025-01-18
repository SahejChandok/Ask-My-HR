export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];

  // Required environment variables
  // Required environment variables
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  // Check for missing variables
  // Check for missing variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`${key} is required`);
    }
  });

  // If any required vars are missing, return early
  // If any required vars are missing, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate Supabase URL format
  // Validate Supabase URL format
  try {
    const url = new URL(import.meta.env.VITE_SUPABASE_URL);
    if (!url.protocol.startsWith('https')) {
      errors.push('VITE_SUPABASE_URL must use HTTPS protocol');
    }
    if (!url.hostname.includes('supabase.co')) {
      errors.push('VITE_SUPABASE_URL must be a Supabase URL');
    }
  } catch (error) {
    errors.push('VITE_SUPABASE_URL must be a valid URL');
  }

  // Validate Anon Key format
  // Validate Anon Key format
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY.match(/^ey.*\..*\..*$/)) {
    errors.push('VITE_SUPABASE_ANON_KEY must be a valid JWT token');
  }

  // Development mode validation
  // Development mode validation
  if (import.meta.env.DEV && import.meta.env.VITE_SKIP_EMAIL_VERIFICATION !== 'true') {
    errors.push('VITE_SKIP_EMAIL_VERIFICATION should be true in development mode');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}