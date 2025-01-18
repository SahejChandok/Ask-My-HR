// Type-safe environment configuration
interface Environment {
  supabase: {
    url: string;
    anonKey: string;
  };
  development: {
    skipEmailVerification: boolean;
    mode: 'development' | 'production';
  };
}

function validateSupabaseUrl(url: string): string {
  if (!url) throw new Error('VITE_SUPABASE_URL is required');
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('https')) {
      throw new Error('VITE_SUPABASE_URL must use HTTPS');
    }
    return url;
  } catch (error) {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }
}

function validateSupabaseKey(key: string): string {
  if (!key) throw new Error('VITE_SUPABASE_ANON_KEY is required');
  if (!key.match(/^ey.*\..*\..*$/)) {
    throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid');
  }
  return key;
}

// Load and validate environment
export const config: Environment = {
  supabase: {
    url: validateSupabaseUrl(import.meta.env.VITE_SUPABASE_URL),
    anonKey: validateSupabaseKey(import.meta.env.VITE_SUPABASE_ANON_KEY),
  },
  development: {
    skipEmailVerification: import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true',
    mode: import.meta.env.MODE || 'production'
  },
} as const;

export function isDevelopment(): boolean {
  return import.meta.env.DEV || 
         import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true' || 
         import.meta.env.MODE === 'development';
}