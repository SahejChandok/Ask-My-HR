export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface Environment {
  supabase: {
    url: string;
    anonKey: string;
  };
  development: {
    skipEmailVerification: boolean;
  };
}

export interface ValidationError {
  field: string;
  errors: string[];
}

function validateSupabaseUrl(url: string | undefined): ValidationError[] {
  const errors: string[] = [];

  if (!url) {
    errors.push('VITE_SUPABASE_URL is required');
    return [{ field: 'VITE_SUPABASE_URL', errors }];
  }

  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('https')) {
      errors.push('Must use HTTPS protocol');
    }
    if (!parsed.hostname.includes('supabase.co')) {
      errors.push('Must be a Supabase URL');
    }
  } catch (error) {
    errors.push('Must be a valid URL');
  }

  return errors.length ? [{ field: 'VITE_SUPABASE_URL', errors }] : [];
}

function validateSupabaseKey(key: string | undefined): ValidationError[] {
  const errors: string[] = [];

  if (!key) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
    return [{ field: 'VITE_SUPABASE_ANON_KEY', errors }];
  }

  if (!key.match(/^ey.*\..*\..*$/)) {
    errors.push('Must be a valid JWT token');
  }

  return errors.length ? [{ field: 'VITE_SUPABASE_ANON_KEY', errors }] : [];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    errors.push('VITE_SUPABASE_URL is required');
  } else {
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith('https')) {
        errors.push('VITE_SUPABASE_URL must use HTTPS');
      }
      if (!parsed.hostname.includes('supabase.co')) {
        errors.push('VITE_SUPABASE_URL must be a Supabase URL');
      }
    } catch (error) {
      errors.push('Invalid VITE_SUPABASE_URL format');
    }
  }

  if (!key) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  } else if (!key.match(/^ey.*\..*\..*$/)) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function getEnvironment(): Environment {
  const validation = validateEnvironment();
  if (!validation.valid) {
    throw new Error(`Invalid environment: ${validation.errors.join(', ')}`);
  }

  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    development: {
      skipEmailVerification: import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true'
    }
  };
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true' || import.meta.env.MODE === 'development';
}