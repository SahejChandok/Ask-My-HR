import { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please try again.';
      case 400:
        if (error.message.includes('Invalid login credentials')) {
          return 'Invalid email or password. Please try the demo account shown below.';
        }
        return error.message;
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 422:
        return 'Invalid email format';
      case 429:
        return 'Too many login attempts. Please try again later';
      case 500:
        if (error.message.includes('Database error')) {
          return 'Unable to connect to the database. Please try again in a few moments.';
        }
        return 'Service temporarily unavailable. Please try again in a few moments.';
      default:
        return `Authentication error (${error.status}): ${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}